# Spezifikation: Sidi Barrani Biet-Hilfe

Dieses Dokument beschreibt die Spezifikationen für die Webanwendung "Sidi Barrani Biet-Hilfe".

## 1. Kernfunktionalität

Die Anwendung ist eine mobile Webseite, die Spieler des Kartenspiels "Sidi Barrani" während der Bietphase unterstützt. Sie bietet eine zentrale Echtzeit-Plattform, um Gebote abzugeben und anzuzeigen.

## 2. Spiel-Erstellung und Lobby

### 2.1. Spiel erstellen
- Ein Spieler kann eine neue Spielrunde eröffnen.
- Bei der Erstellung wird ein eindeutiger, 4-stelliger Code aus Zahlen und Kleinbuchstaben generiert.
- Der Spieler, der das Spiel erstellt, wird als "Ersteller" gekennzeichnet.

### 2.2. Spiel beitreten
- Andere Spieler können einem bestehenden Spiel über den 4-stelligen Code beitreten.
- Jeder Spieler muss vor dem Erstellen oder Beitreten seinen Namen angeben.

### 2.3. Lobby
- Vor dem Spielstart werden alle verbundenen Spieler in einer Lobby angezeigt.
- Die Spielerliste ist für alle Teilnehmer sichtbar.
- Der Ersteller des Spiels ist markiert.

## 3. Spielablauf und Bieten

### 3.1. Spiel starten
- Der Ersteller kann das Spiel von der Lobby aus starten.
- Nach dem Start wird die Biet-Oberfläche für alle Spieler aktiviert.

### 3.2. Bietvorgang
- Die Spieler können in beliebiger Reihenfolge bieten.
- Gebote werden in Echtzeit übermittelt und sind sofort für alle anderen Spieler sichtbar.
- Ein einmal abgegebenes Gebot kann nicht korrigiert werden.

### 3.3. Gebots-Komponenten
Ein Gebot besteht aus:
- **Farbe/Spielart**: 
  - Farben (Schweizer Jasskarten): Rosen, Eicheln, Schellen, Schilten
  - Spielarten: Obeabe, Uneufe
- **Wert**:
  - Ein Vielfaches von 10, bis zu einem Maximum von 150.
  - Alternativ das Gebot "Match".

### 3.4. Neue Bietrunde
- Der Ersteller kann jederzeit eine neue Bietrunde starten.
- Dadurch werden alle aktuellen Gebote gelöscht und die Runde beginnt von vorne.

## 4. Technische Umsetzung

- **Architektur**: Client-Server-Modell
- **Kommunikation**: Echtzeit-Kommunikation über WebSockets.
- **Frontend**: React mit TypeScript.
- **Backend**: Node.js mit Express und ws.
