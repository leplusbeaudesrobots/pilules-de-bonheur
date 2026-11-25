# Pilules de bonheur

App Android perso pour ne plus oublier sa pilule.

- Gros bouton « J'ai pris », retour haptique + confettis, annulation possible
- Rappel à 9h30, relance à 12h si pas coché (« Eh, t'as oublié ta pilule, file la prendre ! »), heures réglables
- Bouton « C'est pris ✓ » directement dans la notification
- Widget écran d'accueil : un tap = coché
- Série, record, jokers (1 au départ, +1 tous les 7 jours, 2 max), badges, calendrier 5 semaines (tap sur un jour pour corriger)

## Installer

Télécharge `pilules-de-bonheur.apk` depuis la release **apk-latest** du repo, puis ouvre-le sur le téléphone (autoriser l'installation depuis le navigateur).
Chaque push reconstruit l'APK (GitHub Actions). Les mises à jour s'installent par-dessus sans perdre l'historique.

## Dev

```bash
npm install
npm test           # logique de série
npm run typecheck
npx expo prebuild --platform android && cd android && ./gradlew assembleRelease
```

Stack : Expo SDK 58, expo-notifications (rappels locaux + action en arrière-plan via expo-task-manager), react-native-android-widget.
Toutes les données restent sur le téléphone (AsyncStorage).
