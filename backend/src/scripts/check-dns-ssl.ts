import { Resolver } from 'dns/promises';

async function checkDomains() {
  const resolver = new Resolver();
  resolver.setServers(['8.8.8.8', '1.1.1.1']);

  const domains = ['asgardcp.com.br', 'mail.asgardcp.com.br', 'smtp.asgardcp.com.br', 'app.asgardcp.com.br'];
  for (const d of domains) {
    try {
      const addresses = await resolver.resolve4(d);
      console.log(`DNS [${d}]:`, addresses);
    } catch (e: any) {
      console.log(`DNS [${d}]:`, e.code);
    }
  }
}

checkDomains();
