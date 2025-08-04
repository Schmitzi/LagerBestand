# LagerBestand - Kurzanleitung

## Was ist LagerBestand?

LagerBestand ist eine Webanwendung zur Verwaltung von Ausrüstungsgegenständen und zur Nachverfolgung von Ausleihen.

## Installation auf Windows mit Docker

### Was ist Docker?

Docker ist ein Programm, das es ermöglicht, Anwendungen in sogenannten "Containern" zu starten. Das bedeutet, dass die gesamte Anwendung mit allen benötigten Komponenten (wie Datenbank, Webserver usw.) in einem Paket kommt und mit wenigen Befehlen gestartet werden kann - ohne komplizierte Installation.

### 1. Docker Desktop installieren

1. Lade Docker Desktop für Windows herunter: [Download Docker Desktop](https://www.docker.com/products/docker-desktop/)
2. Führe die heruntergeladene Installationsdatei aus
3. Folge den Anweisungen des Installers
4. Starte deinen Computer neu, wenn du dazu aufgefordert wirst
5. Nach dem Neustart wird Docker automatisch gestartet (du siehst ein Wal-Symbol in der Taskleiste)

### 2. LagerBestand herunterladen

1. Lade die ZIP-Datei des Projekts herunter: [LagerBestand ZIP](https://github.com/Schmitzi/LagerBestand/archive/refs/heads/main.zip)
2. Entpacke die ZIP-Datei in einen Ordner deiner Wahl (z.B. `C:\LagerBestand`)

### 3. LagerBestand starten

1. Öffne die Windows-Eingabeaufforderung (Drücke Win+R, gib `cmd` ein und drücke Enter)
2. Navigiere zum Projektordner:
   ```
   cd C:\LagerBestand
   ```
3. Starte die Anwendung mit Docker:
   ```
   docker-compose up -d
   ```
4. Warte einen Moment, während Docker die Container startet (beim ersten Mal kann dies einige Minuten dauern)

### 4. LagerBestand verwenden

1. Öffne einen Webbrowser (Chrome, Firefox, Edge)
2. Gehe zu: http://localhost:3000
3. Du solltest nun die LagerBestand-Anwendung sehen!

## Anwendung stoppen

Wenn du die Anwendung beenden möchtest:

1. Öffne die Eingabeaufforderung
2. Navigiere zum Projektordner:
   ```
   cd C:\LagerBestand
   ```
3. Stoppe die Docker-Container:
   ```
   docker-compose down
   ```

## Fehlerbehebung

### Docker startet nicht

- Stelle sicher, dass du deinen Computer nach der Installation von Docker neu gestartet hast
- Überprüfe, ob Docker Desktop läuft (das Wal-Symbol sollte in der Taskleiste erscheinen)

### LagerBestand ist nicht über localhost erreichbar

- Warte ein paar Minuten nach dem Start, bis alle Container vollständig hochgefahren sind
- Überprüfe, ob die Container laufen, indem du in der Eingabeaufforderung eingibst:
  ```
  docker ps
  ```
  Du solltest mindestens 2 Container sehen (einen für die App und einen für die Datenbank)


---

Viel Erfolg mit LagerBestand!


## To implement

- Add events (dropdown)
- User accounts (auth)
- Qr code
   - add to db
   - display / printable


## Ideas from Philip
- Scan qr code in room and link equipment
- Multiple rooms for same event