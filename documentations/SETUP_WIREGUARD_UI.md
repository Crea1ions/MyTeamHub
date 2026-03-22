# Documentation : WireGuard et accès UI MyTeamHub

Ce document récapitule les actions réalisées pour restreindre l'accès à l'UI MyTeamHub via WireGuard, ainsi que les fichiers créés et les commandes utiles pour maintenance et retour arrière.

## Résumé des actions effectuées
- L'application `server` a été modifiée pour n'écouter que sur l'IP WireGuard du VPS (`10.0.0.1:3001`) au lieu de `0.0.0.0`.
- Le processus est géré par `pm2` sous le nom `myteam` (redémarré après modification).
- Un client WireGuard (smartphone) a été généré et ajouté comme peer à `wg0`.
- Un fichier de configuration client et un QR image ont été créés pour import sur mobile.

## Fichiers concernés
- `server/index.js` — modifié : `app.listen(PORT, '10.0.0.1', ...)` (bind sur wg0)
- `/root/myteam/wg-client-myphone.conf` — configuration client WireGuard (contenant clé privée). Garder secret.
- `/root/myteam/wg-client-myphone.png` — QR code PNG scannable pour smartphone.

Ne commitez pas les fichiers contenant des clés privées dans un dépôt public.

## Emplacements et accès
- UI (interne WireGuard) : `http://10.0.0.1:3001`
- Adresse publique (fermée) : `http://<IP_publique>:3001` (par défaut le port public a été bloqué en limitant l'écoute)

## Commandes utiles

Redémarrer l'app via pm2 :

```bash
pm2 restart myteam
```

Vérifier l'écoute :

```bash
ss -ltnp | grep 3001
```

Tester l'UI depuis un poste peer WireGuard :

```bash
curl -I http://10.0.0.1:3001
```

Pour revenir à l'écoute publique (réversible): modifier `server/index.js` et remplacer `10.0.0.1` par `0.0.0.0`, puis :

```bash
pm2 restart myteam
```

## Gestion du peer WireGuard client

Le client a été ajouté sur le serveur avec l'IP `10.0.0.3/32`.

Supprimer le peer (exemple) :

```bash
# lister peers pour trouver la clé publique du client
sudo wg show wg0 peers

# supprimer un peer (remplacer <PUBKEY> par la clé publique du client)
sudo wg set wg0 peer <PUBKEY> remove
```

Générer un nouveau client (exemple rapide) :

```bash
# sur le client
wg genkey | tee privatekey | wg pubkey > publickey

# créer le fichier conf localement puis ajouter le peer sur le serveur :
sudo wg set wg0 peer $(cat publickey) allowed-ips 10.0.0.X/32 preshared-key <fichier_psk>
```

## QR / Import mobile
- Le fichier `/root/myteam/wg-client-myphone.png` contient un QR scannable (ex: via l'app WireGuard sur smartphone).
- Alternativement, importer `/root/myteam/wg-client-myphone.conf` dans l'app WireGuard.

## Persistance pm2 au reboot

```bash
pm2 save
pm2 startup
# suivre la commande affichée par `pm2 startup` (exécuter en sudo si demandé)
```

## Sécurité et bonnes pratiques
- Ne publiez pas les clés privées. Supprimez les fichiers de config du VPS si vous les stockez ailleurs.
- Si d'autres services utilisent WireGuard, vérifiez `ip -4 addr show` et `ip route` avant de modifier les bindings.
- Pour limiter l'accès externe au port 3001 au lieu de modifier le code, préférez une règle provider-level (security group) restreinte.

## Configuration serveur (extrait)
Voici l'extrait important de la configuration serveur modifiée pour binder sur l'interface WireGuard :

Fichier: `server/index.js`

```js
const PORT = process.env.PORT || 3001;

// Bind only to the WireGuard IP (wg0) for internal-only access
app.listen(PORT, '10.0.0.1', () => {
	console.log(`MyTeam Hub running on ${PORT}`);
	console.log(`UI available on WireGuard at: http://10.0.0.1:${PORT}/`);
});
```

Emplacements importants :
- Application server: `/root/myteam/server/index.js`
- UI static files: `/root/myteam/ui/`
- PM2 process name: `myteam` (géré par `pm2`)

Note: supprimer le fichier client `.conf` sur le VPS (comme fait ici) n'affecte pas le fonctionnement du peer déjà ajouté dans `wg0` — seule la présence du fichier sur le disque est supprimée. Pour supprimer complètement le peer du serveur, exécutez la commande indiquée dans la section "Gestion du peer WireGuard client".

---
Fichier généré automatiquement par l'opérateur (actions réalisées le même jour). Conservez ce document dans un dossier non public si vous y laissez des chemins ou références sensibles.
