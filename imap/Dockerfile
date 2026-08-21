FROM alpine:3.19

RUN apk add --no-cache dovecot dovecot-mysql dovecot-lmtpd

RUN mkdir -p /var/mail/vhosts /etc/dovecot/conf.d

COPY dovecot.conf /etc/dovecot/dovecot.conf
COPY dovecot-sql.conf.ext /etc/dovecot/dovecot-sql.conf.ext
COPY conf.d/ /etc/dovecot/conf.d/

RUN addgroup -g 5000 vmail && \
    adduser -u 5000 -G vmail -s /sbin/nologin -D vmail && \
    chown -R vmail:vmail /var/mail /etc/dovecot

EXPOSE 143 993

CMD ["dovecot", "-F"]
