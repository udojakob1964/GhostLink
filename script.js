async function connectPuckJS() {
    try {
        //redirectConsoleToTextarea(document.getElementById("textareaId"));
        console.log("🔍 Suche nach Puck.js...");
        document.getElementById("status").innerText = "🟡 Searching for Remote Control ...";

        // 1️⃣ Bluetooth-Gerät suchen
        const device = await navigator.bluetooth.requestDevice({
            filters: [{ namePrefix: "Puck.js" }],
            optionalServices: ['6e400001-b5a3-f393-e0a9-e50e24dcca9e'] // Nordic UART Service UUID
        });

        console.log(`✅ Gefunden: ${device.name}`);
        document.getElementById("status").innerText = `🟢 Connected to ${device.name}`;

        // 2️⃣ Verbindung herstellen
        const server = await device.gatt.connect();
        console.log("🔗 Verbindung hergestellt!");

        // 3️⃣ UART Service abrufen
        const service = await server.getPrimaryService('6e400001-b5a3-f393-e0a9-e50e24dcca9e');

        // 4️⃣ RX-Charakteristik (Datenempfang) abrufen
        const characteristic = await service.getCharacteristic('6e400003-b5a3-f393-e0a9-e50e24dcca9e');

        // 5️⃣ Benachrichtigungen aktivieren
        await characteristic.startNotifications();
        console.log("📡 Benachrichtigungen aktiviert!");

        // Gerät wach halten (oder aufwecken??)
        await requestWakeLock();

        // 6️⃣ Event-Listener für Button-Events hinzufügen
        characteristic.addEventListener('characteristicvaluechanged', (event) => {
            let value = new TextDecoder().decode(event.target.value);
            console.log(`🔹 Empfangene Daten: ${value}`);

            if (value.includes("BTN_UP")) {
                console.log("⬆️ Button up recognized!");
                document.getElementById("status").innerText = "🟢 Button released!";
                //beep(300,100);
                //navigator.vibrate(100);
                //new Audio("Button-down.mp3").play(); 

                const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
                recognition.lang = 'de-DE';
                
                recognition.start();
                //new Audio("Button-down.mp3").play();  // to be informed that the recognition is starting
                // seems no to be necessary because on android the microphone is activated by the browser and beeps...
                recognition.onresult = async (event) => {
                    const userSpeech = event.results[0][0].transcript;
                    console.log(`Gesprochener Text: ${userSpeech}`);
                    document.getElementById('status').textContent = `SpeechToText: ${userSpeech}`;

                    // Anfrage an ChatGPT senden
                    const chatGPTResponse = await sendChatGPTRequest(userSpeech);
                    //const chatGPTResponse = "Bald wird das hier funktionieren!";
                    document.getElementById('status').textContent = `TextToSpeech: ${chatGPTResponse}`;
                    speak(chatGPTResponse);
                };

                recognition.onerror = (event) => {
                    console.error('Spracherkennung Fehler:', event.error);
                };

            } 
            
            if (value.includes("BTN_DOWN")) {
                speechSynthesis.cancel();   // stop speaking
                console.log("⬇️ Button down recognized!");
                document.getElementById("status").innerText = "🟠 Connected, Button pressed!";
                //beep(1000,100);
                //navigator.vibrate(200);
                //new Audio("Button-up.mp3").play();
            }
            
            if (value.includes("E.getBattery()")) {
                console.log("Answer for Battery Level received!");
                //let batteryLevel = parseInt(value.substring(18,2));
                let batteryLevel = value.substr(17,2);
                console.log(`🔋 Batteriestand erhalten: ${batteryLevel}%`);
                updateBatteryDisplay(parseInt(batteryLevel));
                new Audio("Battery-level.mp3").play();
            }
        });

        // 7️⃣ TX-Charakteristik (Daten senden) abrufen
        const txCharacteristic = await service.getCharacteristic('6e400002-b5a3-f393-e0a9-e50e24dcca9e');

        // 7️⃣ Befehl an Puck.js senden, um den Batteriestand zu bekommen
        const command = "E.getBattery()\n"; // Befehl für Espruino
        await txCharacteristic.writeValue(new TextEncoder().encode(command));

        //const command2 = "setWatch(function(e) {Bluetooth.println(e.state ? 'BTN_DOWN' : 'BTN_UP');}, BTN, {edge:'both', debounce:50, repeat:true})\n";
        //await txCharacteristic.writeValue(new TextEncoder().encode(command2));

        console.log("📤 Befehl gesendet: Batteriestand abfragen...");

        // 8️⃣ Korrigierter Befehl für Puck.js
        // const command = "setWatch(function(e) {Bluetooth.println(e.state ? 'BTN_DOWN' : 'BTN_UP');}, BTN, {edge:'both', debounce:50, repeat:true});\n";
        // !!!! Command lässt sich irgendwie nicht auf den Puck übertragen. 
        // => Als workaround: Einfach die Konsole (https://www.espruino.com/ide/) öffnen, verbinden, command pasten und ins RAM schreiben....
        // 9️⃣ Befehl an Puck.js senden
        //await txCharacteristic.writeValueWithoutResponse(new TextEncoder().encode(command));
        // console.log("🎯 Button-Event-Listener auf Puck.js aktiviert!"); 

        // 🔟 Event, wenn die Verbindung getrennt wird
        device.addEventListener('gattserverdisconnected', () => {
            console.log("❌ Verbindung getrennt!");
            document.getElementById("status").innerText = "🔴 Connection lost!";
        });

        // Alles hat geklappt => Haken setzen an ScanButton:
        //document.getElementById("connectBluetoothDevice").innerHTML += ' <i class="bi bi-check2-circle"></i>';
        //document.getElementById("connectBluetoothDevice").style.backgroundColor= "lightgreen";

        navigator.mediaDevices.enumerateDevices().then(devices => {
            devices.forEach(device => {
                if (device.kind === 'audioinput') {
                    console.log(`Eingabegerät gefunden: ${device.label} (${device.deviceId})`);
                }
            });
        }).catch(error => console.error('Fehler beim Abrufen der Audiogeräte:', error));

        const stream = await selectMicrophone();
        if (!stream) {
            console.error('Kein Mikrofon-Stream verfügbar.');
            return;
        }

    } catch (error) {
        console.error("❌ Fehler:", error);
        //document.getElementById("connectBluetoothDevice").innerText = "❌ Error during connection!"; 
        document.getElementById("status").innerText = "❌ Error during connection! Please choose the PUCK.js!";
    }
}


// 🔘 Verbindung mit Button starten
document.querySelector("#connectBluetoothDevice").addEventListener("click", connectPuckJS);
document.querySelector("#setApiKey").addEventListener("click", setApiKey);
document.addEventListener("DOMContentLoaded", function() {
    redirectConsoleToTextarea("textareaId");
});

function beep(frequency = 440, duration = 500) {
    let audioContext = new (window.AudioContext || window.webkitAudioContext)();
    let oscillator = audioContext.createOscillator();
    let gainNode = audioContext.createGain();

    oscillator.type = "sine"; // Tonform: sine, square, triangle, sawtooth
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    setTimeout(() => {
        oscillator.stop();
        audioContext.close();
    }, duration);
}

function updateBatteryDisplay(level) {
    let batteryBar = document.getElementById("batteryBar");

    // Begrenzung zwischen 0% und 100%
    level = Math.max(0, Math.min(100, level));

    // Fortschrittsbalken aktualisieren
    batteryBar.style.width = `${level}%`;
    batteryBar.setAttribute("aria-valuenow", level);
    batteryBar.innerText = `${level} % 🔋 Battery`;

    // Farbe je nach Ladestand anpassen
    if (level > 65) {
        batteryBar.className = "progress-bar bg-success"; // Grün
    } else if (level > 20) {
        batteryBar.className = "progress-bar bg-warning"; // Gelb
    } else {
        batteryBar.className = "progress-bar bg-danger"; // Rot
    }
}

function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'de-DE';
    utterance.rate = 1.5;
    speechSynthesis.speak(utterance);
}

async function sendChatGPTRequest(userMessage) {    
    const apiKey = localStorage.getItem('openai_api_key'); 
    if (!apiKey) {
        alert('Bitte OpenAI API-Schlüssel eingeben!');
        return;
    }

    const url = 'https://api.openai.com/v1/chat/completions';

    const requestBody = {
        //model: "gpt-3.5-turbo",
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: userMessage }],
        max_tokens: 100
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
                'Referer': 'https://www.google.com/'  // Fake-Referer
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`HTTP-Fehler! Status: ${response.status}`);
        }

        const responseData = await response.json();
        console.log("ChatGPT Antwort:", responseData.choices[0].message.content);
        return responseData.choices[0].message.content;
    } catch (error) {
        console.error('Fehler beim Abrufen der ChatGPT-Antwort:', error);
    }
}


let wakeLock = null;

async function requestWakeLock() {
    if ('wakeLock' in navigator) {
        try {
            wakeLock = await navigator.wakeLock.request('screen');
            console.log('Wake Lock aktiviert');

            wakeLock.addEventListener('release', () => {
                console.log('Wake Lock deaktiviert');
            });
        } catch (err) {
            console.error(`Wake Lock Fehler: ${err.name}, ${err.message}`);
        }
    } else {
        console.warn('Wake Lock API wird nicht unterstützt');
    }
}

function setApiKey() {
    const key = prompt("Please enter API-Key:", localStorage.getItem('openai_api_key'));
    if (key) {
        localStorage.setItem('openai_api_key', key);
        alert('API-Schlüssel gespeichert!');
    }
}


function redirectConsoleToTextarea(textareaId) {
    const textarea = document.getElementById(textareaId);
    if (!textarea) {
        console.error(`Textarea with id "${textareaId}" not found.`);
        return;
    }
    
    function writeToTextarea(message) {
        //textarea.value += message + "\n";
        //textarea.scrollTop = textarea.scrollHeight; // Scroll to bottom
        textarea.value = message + "\n"+textarea.value;
    }
    
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    
    console.log = function (...args) {
        originalLog.apply(console, args);
        writeToTextarea("[LOG] " + args.join(" "));
    };
    
    console.warn = function (...args) {
        originalWarn.apply(console, args);
        writeToTextarea("[WARN] " + args.join(" "));
    };
    
    console.error = function (...args) {
        originalError.apply(console, args);
        writeToTextarea("[ERROR] " + args.join(" "));
    };
}


async function selectMicrophone() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputDevices = devices.filter(device => device.kind === 'audioinput');

        if (audioInputDevices.length === 0) {
            console.error('Keine Audiogeräte gefunden.');
            return;
        }

        // Beispiel: Wähle das erste verfügbare Mikrofon
        //const selectedDeviceId = audioInputDevices[0].deviceId;
        const selectedDeviceId = audioInputDevices[0].deviceId; 

        // Optional: Benutzer zur Auswahl eines Mikrofons auffordern
        //const selectedDeviceId = prompt("Bitte wählen Sie ein Mikrofon:", audioInputDevices.map(device => device.label).join('\n'));
        //const selectedDeviceId = prompt("Bitte wählen Sie ein Mikrofon:", audioInputDevices.map(device => device.label+'\n').join('\n'));
        
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                deviceId: selectedDeviceId
            }
        });

        console.log(`Verwendetes Mikrofon: ${audioInputDevices[0].label}`);
        return stream;
    } catch (error) {
        console.error('Fehler beim Abrufen der Audiogeräte:', error);
    }
}