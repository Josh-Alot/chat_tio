# Acessar a instância Oracle de outro dispositivo

A VM da Oracle Cloud só aceita login por **chave SSH** (login por senha vem
desativado). Então, para acessar de um aparelho novo, esse aparelho precisa de
uma chave que o servidor reconheça.

- **Usuário:** `ubuntu`
- **IP público (`SEU_IP_PUBLICO`):** obtenha nas configurações da instância no
  Oracle Cloud, em **Compute → Instances → sua instância → Instance information
  → Public IP address**. Substitua `SEU_IP_PUBLICO` por esse valor em todos os
  comandos abaixo.
  _(Se a instância usar IP efêmero, ele pode mudar após reboot — nesse caso
  confira o valor atualizado nesse mesmo lugar.)_

---

## Opção A — Recomendada: gerar uma chave nova neste dispositivo

Cada aparelho tem a própria chave; assim dá pra revogar um sem afetar os outros.

**1. Neste dispositivo novo**, gere o par de chaves e copie a pública:
```bash
ssh-keygen -t ed25519 -C "descricao-do-dispositivo"
cat ~/.ssh/id_ed25519.pub        # copie a linha inteira (a chave PÚBLICA)
```

**2. Em um dispositivo que JÁ tem acesso**, entre no servidor e autorize a nova
chave (use `>>` para não apagar as chaves existentes):
```bash
ssh ubuntu@SEU_IP_PUBLICO
echo "COLE_AQUI_A_LINHA_PUBLICA" >> ~/.ssh/authorized_keys
exit
```

**3. De volta no dispositivo novo**, conecte:
```bash
ssh -i ~/.ssh/id_ed25519 ubuntu@SEU_IP_PUBLICO
```

> `ssh-copy-id` não funciona aqui, porque depende de login por senha (desativado
> na Oracle). Por isso a chave nova precisa ser adicionada a partir de um
> dispositivo que já tem acesso, como no passo 2.

---

## Opção B — Rápida: reutilizar a chave atual

Transfira o arquivo da **chave privada** existente para o novo dispositivo de
forma segura (gerenciador de senhas, pendrive criptografado, ou `scp` direto
entre suas máquinas — **nunca** por email/chat). No destino:
```bash
mkdir -p ~/.ssh && chmod 700 ~/.ssh
# coloque o arquivo da chave em ~/.ssh/ e ajuste a permissão:
chmod 600 ~/.ssh/SUA_CHAVE
ssh -i ~/.ssh/SUA_CHAVE ubuntu@SEU_IP_PUBLICO
```

---

## Atalho opcional (`~/.ssh/config`)

Para não digitar `-i` e o IP toda vez, adicione no `~/.ssh/config` do dispositivo:
```sshconfig
Host oracle-bot
    HostName SEU_IP_PUBLICO
    User ubuntu
    IdentityFile ~/.ssh/id_ed25519
```
Depois é só `ssh oracle-bot` (e `scp arquivo oracle-bot:~/destino`).

---

## Depois de acessar: rodar/gerenciar o bot

O deploy 24h roda via systemd (veja `deploy/vovo-bot.service`). Comandos úteis:

| Ação        | Comando                                                                |
| ----------- | --------------------------------------------------------------------- |
| Status      | `sudo systemctl status vovo-bot`                                      |
| Logs        | `journalctl -u vovo-bot -f`                                           |
| Reiniciar   | `sudo systemctl restart vovo-bot`                                     |
| Atualizar   | `cd ~/chat_tio && git pull && npm install --omit=dev && sudo systemctl restart vovo-bot` |
