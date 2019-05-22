# Creating cert for local testing

**1** Create `security/localhost.conf` with the following content:

```
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = req_dn
req_extensions = req_ext
[req_dn]
C = HU
CN = localhost
ST = Budapest
O = localhost
[req_ext]
subjectAltName = @alt_names
keyUsage = digitalSignature
extendedKeyUsage = serverAuth
[alt_names]
DNS.1 = localhost
DNS.2 = cdn.localhost
```

**2** Go to `security` folder and do the following steps (based on `https://gist.github.com/fntlnz/cf14feb5a46b2eda428e000157447309`)

Generate Root CA:

`openssl genrsa -out rootCA.key 4096`

On windows: 
`openssl req -x509 -new -nodes -key rootCA.key -sha256 -days 1024 -out rootCA.crt -subj '//CN=localhost\C=HU\ST=Budapest\O=localhost'`

On mac/linux:
`openssl req -x509 -new -nodes -key rootCA.key -sha256 -days 1024 -out rootCA.crt -subj '/CN=localhost/C=HU/ST=Budapest/O=localhost'`

Generate localhost cert:

`openssl genrsa -out localhost.key 2048`

`openssl req -new -key localhost.key -out localhost.csr -config localhost.conf`

validate csr: `openssl req -in localhost.csr -noout -text`

`openssl x509 -req -in localhost.csr -CA rootCA.crt -CAkey rootCA.key -CAcreateserial -out localhost.crt -days 365 -sha256 -extfile localhost.conf -extensions req_ext`

validate crt: `openssl x509 -in localhost.crt -text -noout`
