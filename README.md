# GhostLink


GhostLink soll eine kleine Progressive Web App werden, die es ermöglicht unbemerkt auf ChatGPT Anfragen zu stellen und die Antworten darauf unbemerkt von anderen Personen via Ohrhörer zu bekommen.

Zum Formulieren der Anfrage wird ein Button gedrückt gehalten. Beim Loslassen des Buttons wird der erkannte transkriptierte Text an ChatGPT gesendet. Die empfangene Antort wird wiederum nach Sprache gewandelt und wird z.B. über Ohrhörer wiedergegeben.

Der Button soll über Bluetooth mit beliebigen Geräten verwendbar sein. Dazu wird hier der Puck.js von Espruino benutzt.
Um dem Button die entsprechende Funktionalität zu geben, muss man über die Seite:

[https://www.puck-js.com/puck.js](https://www.espruino.com/ide/#)

den Button verbinden und über die Konsole die folgende Funktion in das Ram des Buttons schreiben:

setWatch(function(e) {Bluetooth.println(e.state ? 'BTN_DOWN' : 'BTN_UP');}, BTN, {edge:'both', debounce:50, repeat:true});

Eigentlich sollte das auch direkt über das script von der webseite aus möglich sein - hat hier aber leider nicht geklappt...

...
const command = "setWatch(function(e) {Bluetooth.println(e.state ? 'BTN_DOWN' : 'BTN_UP');}, BTN, {edge:'both', debounce:50, repeat:true});\n";
await txCharacteristic.writeValueWithoutResponse(new TextEncoder().encode(command));
....

Die Seite soll verschiedene Sektionen haben:<p>
- Setup für den Puck.js Button.
- Auswahl eines vorbereiteten Prompts, der der eigentlichen Anfrage voran gestellt wird um spezifischere Antworten geben zu können (z.B. sehr knappe Antwort, oder Lustige Funfacts zum Thema etc...
- Testbereich mit symbolisiertem Puck.js um auch ohne Puck das Progamm bedienen zu können.

Die Seite soll als Progressive WebApp fungieren und auf dem Endgerät installierbar sein (um nicht als Webbrowser erkennbar zu sein)


Scheint ein gutes Startprojekt zu sein, um in WebBluetooth, JS, html, css und Github mal Erfahrungen sammeln zu können. 
