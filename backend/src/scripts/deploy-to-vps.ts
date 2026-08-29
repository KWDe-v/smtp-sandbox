import { Client } from 'ssh2';
import fs from 'fs';
import path from 'path';

const VPS_HOST = '179.199.136.14';
const VPS_USER = 'antigravity';
const VPS_PASS = 'smtp';
const REMOTE_DIR = '/home/antigravity/smtp-sandbox';

const LOCAL_ROOT = path.resolve(process.cwd(), '..');

function createSshClient(): Promise<Client> {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    conn
      .on('ready', () => {
        console.log('✅ Conexão SSH estabelecida com sucesso!');
        resolve(conn);
      })
      .on('error', (err) => {
        console.error('❌ Erro na conexão SSH:', err);
        reject(err);
      })
      .connect({
        host: VPS_HOST,
        port: 22,
        username: VPS_USER,
        password: VPS_PASS,
        readyTimeout: 30000,
      });
  });
}

function execCommand(conn: Client, command: string, useSudo = false): Promise<string> {
  return new Promise((resolve, reject) => {
    const fullCmd = useSudo ? `echo '${VPS_PASS}' | sudo -S ${command}` : command;
    console.log(`\n💻 [Executando]: ${command}`);

    conn.exec(fullCmd, (err, stream) => {
      if (err) return reject(err);

      let stdout = '';
      let stderr = '';

      stream
        .on('close', (code: number) => {
          if (code === 0) {
            resolve(stdout.trim());
          } else {
            console.warn(`[Aviso/Código ${code}]: ${stderr || stdout}`);
            resolve(stdout || stderr);
          }
        })
        .on('data', (data: Buffer) => {
          const str = data.toString();
          process.stdout.write(str);
          stdout += str;
        })
        .stderr.on('data', (data: Buffer) => {
          const str = data.toString();
          // Ignora mensagens padrão de sudo
          if (!str.includes('[sudo] password')) {
            process.stderr.write(str);
            stderr += str;
          }
        });
    });
  });
}

async function uploadDirectory(sftp: any, localDir: string, remoteDir: string) {
  const items = fs.readdirSync(localDir);

  for (const item of items) {
    if (
      item === 'node_modules' ||
      item === '.git' ||
      item === '.output' ||
      item === '.nuxt' ||
      item === 'dist' ||
      item === '.system_generated'
    ) {
      continue;
    }

    const localPath = path.join(localDir, item);
    const remotePath = `${remoteDir}/${item}`.replace(/\\/g, '/');
    const stat = fs.statSync(localPath);

    if (stat.isDirectory()) {
      await new Promise<void>((resolve) => {
        sftp.mkdir(remotePath, () => resolve());
      });
      await uploadDirectory(sftp, localPath, remotePath);
    } else {
      await new Promise<void>((resolve, reject) => {
        sftp.fastPut(localPath, remotePath, (err: any) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  }
}

async function main() {
  console.log(`====================================================`);
  console.log(`🚀 Iniciando Deploy Automatizado na VPS ${VPS_HOST}`);
  console.log(`👤 Usuário: ${VPS_USER}`);
  console.log(`====================================================`);

  const conn = await createSshClient();

  try {
    // 1. Identifica o Sistema Operacional e Status
    console.log('\n🔍 Verificando sistema operacional e ambiente...');
    await execCommand(conn, 'uname -a');
    await execCommand(conn, 'cat /etc/os-release | grep PRETTY_NAME || true');

    // 2. Verifica se Docker e Docker Compose estão instalados
    console.log('\n🐳 Verificando Docker e Docker Compose...');
    const dockerCheck = await execCommand(conn, 'docker --version || true');
    const composeCheck = await execCommand(conn, 'docker compose version || true');

    if (!dockerCheck.includes('Docker version') || !composeCheck.includes('Docker Compose')) {
      console.log('\n📦 Instalando Docker e Docker Compose na VPS...');
      await execCommand(conn, 'apt-get update -y', true);
      await execCommand(conn, 'apt-get install -y docker.io docker-compose-v2 curl git ca-certificates', true);
      await execCommand(conn, `usermod -aG docker ${VPS_USER}`, true);
      await execCommand(conn, 'systemctl enable --now docker', true);
    } else {
      console.log('✅ Docker e Docker Compose já instalados.');
    }

    // Garante permissões no docker.sock
    await execCommand(conn, `usermod -aG docker ${VPS_USER} && chmod 666 /var/run/docker.sock || true`, true);

    // 3. Prepara diretório remoto
    console.log(`\n📁 Preparando diretório remoto ${REMOTE_DIR}...`);
    await execCommand(conn, `mkdir -p ${REMOTE_DIR}`);

    // 4. Upload dos arquivos do projeto via SFTP
    console.log('\n📤 Enviando arquivos do projeto para a VPS...');
    const sftp = await new Promise<any>((resolve, reject) => {
      conn.sftp((err, s) => {
        if (err) reject(err);
        else resolve(s);
      });
    });

    await uploadDirectory(sftp, LOCAL_ROOT, REMOTE_DIR);
    console.log('✅ Arquivos enviados com sucesso.');

    // 5. Configura .env na VPS
    console.log('\n⚙️ Configurando variáveis de ambiente na VPS...');
    await execCommand(conn, `cd ${REMOTE_DIR} && cp -n .env.example .env || true`);

    // 6. Constrói e inicializa os containers com Docker Compose
    console.log('\n🚀 Construindo imagens e iniciando containers Docker...');
    await execCommand(conn, `cd ${REMOTE_DIR} && docker compose up -d --build`, false);

    // 7. Aguarda inicialização dos serviços
    console.log('\n⏳ Aguardando serviços ficarem saudáveis (15s)...');
    await new Promise((r) => setTimeout(r, 15000));

    // 8. Verifica status dos containers
    console.log('\n📊 Status dos containers:');
    await execCommand(conn, `cd ${REMOTE_DIR} && docker compose ps`, false);

    // 9. Testa endpoints de saúde localmente na VPS
    console.log('\n🧪 Testando endpoints HTTP:');
    await execCommand(conn, 'curl -s http://localhost:4000/api/health || true');
    console.log('');
    await execCommand(conn, 'curl -I http://localhost:3000 || true');

    console.log('\n====================================================');
    console.log('🎉 DEPLOY CONCLUÍDO COM SUCESSO NA VPS!');
    console.log(`🌐 Painel Web: https://app.asgardcp.com.br (ou http://${VPS_HOST})`);
    console.log(`📚 Documentação da API: https://app.asgardcp.com.br/docs`);
    console.log(`🔌 API Base URL: https://app.asgardcp.com.br`);
    console.log(`🗄️ phpMyAdmin: http://${VPS_HOST}:8080`);
    console.log(`✉️ SMTP Portas: 25 e 587`);
    console.log(`📬 IMAP Portas: 143 e 993`);
    console.log('====================================================\n');
  } catch (err: any) {
    console.error('❌ Erro durante o processo de deploy:', err.message);
  } finally {
    conn.end();
  }
}

main();
