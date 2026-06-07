let currentStoryData = {
    destination: "",
    story: "",
    image: ""
};

function selectOption(category, element) {
    // 1. Get the parent group (the row of buttons)
    const parent = element.parentElement;

    // 2. Remove 'selected' class from all buttons in this specific group
    const siblings = parent.querySelectorAll('.option');
    siblings.forEach(btn => btn.classList.remove('selected'));
    
    // 3. Add 'selected' to the one you clicked
    element.classList.add('selected');
    
    // 4. Update the hidden input value for the API
    document.getElementById(category).value = element.getAttribute('data-value');
}

//Function to slide/fade between our pages
function showPage(pageId){
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    const target = document.getElementById(pageId);
    if(target){
        target.classList.add('active');
    }
}

async function generateJourney() {
    const mood = document.getElementById("mood").value;
    startDynamicMusic(mood);

    const display = document.getElementById("story-display");
    const storyImg = document.getElementById("story-image");
    const saveBtn = document.getElementById("save-btn");

    // Grab the values currently stored in the hidden inputs
    const personality = document.getElementById("personality").value;
    const budget = document.getElementById("budget").value;
    const preference = document.getElementById("preference").value;

    display.innerText = "Consulting the stars and composing your destiny...";
    storyImg.style.display = "none";
    saveBtn.disabled = true;
    saveBtn.innerText = "💾 SAVE TO CHRONICLES";
    showPage('story-page');

    try {
        const response = await fetch(
            `http://127.0.0.1:5000/get_story?personality=${personality}&mood=${mood}&budget=${budget}&preference=${preference}`
        );
        const data = await response.json();
        display.innerText = data.story;
        storyImg.src = `/static/images/${encodeURIComponent(data.image)}`;
        storyImg.style.display = "block";
        currentStoryData.destination = data.destination;
        currentStoryData.story = data.story;
        currentStoryData.image = data.image;
        saveBtn.disabled = false;
    } catch (error) {
        display.innerText = "Connection lost. Is your Flask server running?";
        storyImg.style.display = "none";
    }
}
async function saveCurrentStory() {
    const saveBtn = document.getElementById("save-btn");
    if(!currentStoryData.story) return;

    try {
        const response = await fetch('http://127.0.0.1:5000/save_story', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(currentStoryData)
        });
        const data = await response.json();
        if(data.status === "success") {
            saveBtn.innerText = "✅ SAVED";
            saveBtn.disabled = true;
        }
    } catch(err) {
        alert("Failed to lock entry to data registries.");
    }
}
async function showHistory() {
    const container = document.getElementById("history-container");
    container.innerHTML = "<p class='loading-text'>Accessing the historical vault...</p>";
    showPage("history-page");

    try {
        const response = await fetch("http://127.0.0.1:5000/history");
        const data = await response.json();

        if (data.status === "success" && data.history.length > 0) {
            container.innerHTML = ""; // Clear loader
            
            data.history.forEach(item => {
                // Generate a visual image overlay component for every story item in history logs
                const card = document.createElement("div");
                card.className = "history-card";
                card.innerHTML = `
                    <div class="history-poster">
                        <img src="/static/images/${encodeURIComponent(item.image)}" alt="Realm View">
                        <div class="poster-overlay-gradient"></div>
                        <div class="history-card-text">
                            <h3>${item.destination}</h3>
                            <p>${item.story}</p>
                        </div>
                    </div>
                `;
                container.appendChild(card);
            });
        } else {
            container.innerHTML = "<p class='empty-msg'>The archives are currently empty.</p>";
        }
    } catch(error) {
        container.innerHTML = "<p class='empty-msg'>Unable to process storage matrices.</p>";
    }
}

async function wipeHistory() {
    if(!confirm("Are you certain you wish to purge all recorded chronicle timelines?")) return;
    
    try {
        const response = await fetch("http://127.0.0.1:5000/delete_history", { method: 'POST' });
        const data = await response.json();
        if(data.status === "success") {
            showHistory(); // Refresh view state
        }
    } catch(err) {
        alert("Error handling request.");
    }
}

const music = document.getElementById("bg-music");
const musicBtn = document.getElementById("music-toggle");

function startDynamicMusic(moodValue) {
    let trackName = "peaceful.mp3";
    if (moodValue === "1") {
        trackName = "peaceful.mp3";
    } else if (moodValue === "2") {
        trackName = "mysterious.mp3";
    } else if (moodValue === "3") {
        trackName = "dangerous.mp3";
    } else if (moodValue === "4") {
        trackName = "despair.mp3";
    }

    const trackUrl = `/static/audio/${trackName}`;

    if(!music.src.includes(trackUrl)) {
        music.src = trackUrl;
        music.load();
    }

    if (music.paused) {
        music.play().then(() => {
            musicBtn.innerText = "🎵 Music: On";
        }).catch(err => console.log("Audio play blocked initially: ", err));
    }
}

function toggleMusic() {
    if (music.src === "" || music.src === window.location.href) {
        // If music hasn't started yet, play the default peaceful track
        const mood = document.getElementById("mood").value;
        startDynamicMusic(mood);
        return;
    }

    if (music.paused) {
        music.play();
        musicBtn.innerText = "🎵 Music: On";
    } else {
        music.pause();
        musicBtn.innerText = "🎵 Music: Off"
    }
}