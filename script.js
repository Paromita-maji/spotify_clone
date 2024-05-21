let currentSong = new Audio();
let allSongs = []; // Store all songs across folders
let currFolder;

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}

async function getsongs(folder){
    currFolder = folder;
    let a = await fetch(`http://127.0.0.1:3000/${folder}/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");
    let songs = [];
    for(let index = 0; index < as.length; index++){
        const element = as[index];
        if(element.href.endsWith(".mp3")){
            songs.push({
                name: element.href.split(`/${folder}/`)[1].replaceAll("%20", " "),
                path: element.href,
                folder: folder
            });
        }
    }
    return songs;
}

async function loadAllSongs() {
    let a = await fetch(`http://127.0.0.1:3000/songs/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let anchors = div.getElementsByTagName("a");
    let array = Array.from(anchors);
    
    for (let index = 0; index < array.length; index++) {
        const e = array[index];
        if (e.href.includes("/songs")){
            let folder = e.href.split("/").slice(-2)[0];
            let folderSongs = await getsongs(`songs/${folder}`);
            allSongs = allSongs.concat(folderSongs);
        }
    }
}

const playMusic = (track, pause = false) => {
    currentSong.src = track.path;
    if (!pause) {
        currentSong.play();
        document.getElementById("play").src = "pause.svg";
    }
    document.querySelector(".songinfo").innerHTML = decodeURI(track.name);
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
}

function displaySongs(songs) {
    let songUL = document.querySelector(".songList ul");
    songUL.innerHTML = "";
    for (const song of songs) {
        songUL.innerHTML += `<li><img class="invert" width="34" src="music.svg" alt="">
                            <div class="info">
                                <div>${song.name}</div>
                                <div>Paro</div>
                            </div>
                            <div class="playnow">
                                <span>Play Now</span>
                                <img class="invert" src="play.svg" alt="">
                            </div> </li>`;
    }

    Array.from(document.querySelector(".songList").getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", () => {
            const songName = e.querySelector(".info").firstElementChild.innerHTML.trim();
            const song = allSongs.find(s => s.name === songName);
            if (song) playMusic(song);
        });
    });
}

async function displayAlbums() {
    let a = await fetch(`http://127.0.0.1:3000/songs/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let anchors = div.getElementsByTagName("a");
    let cardContainer = document.querySelector(".cardContainer");
    let array = Array.from(anchors);
    for (let index = 0; index < array.length; index++) {
        const e = array[index];
        if (e.href.includes("/songs")) {
            let folder = e.href.split("/").slice(-2)[0];
            let a = await fetch(`http://127.0.0.1:3000/songs/${folder}/info.json`);
            let response = await a.json();
            cardContainer.innerHTML += `<div data-folder="${folder}" class="card">
                <div class="play">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 3v18l14-9-14-9z" fill="#000000" />
                    </svg>
                </div>
                <img src="/songs/${folder}/cover.jpg" alt="">
                <h2>${response.title}</h2>
                <p>${response.description}</p>
            </div>`;
        }
    }

    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async item => {
            const folder = item.currentTarget.dataset.folder;
            const folderSongs = await getsongs(`songs/${folder}`);
            displaySongs(folderSongs);
            playMusic(folderSongs[0]);
        });
    });
}

function performSearch() {
    const searchInput = document.getElementById('leftSearchInput').value.toLowerCase();
    const filteredSongs = allSongs.filter(song => song.name.toLowerCase().includes(searchInput));
    displaySongs(filteredSongs);
}

async function main() {
    await loadAllSongs();
    const initialSongs = await getsongs("songs/ncs");
    displaySongs(initialSongs);
    playMusic(initialSongs[0], true);
    await displayAlbums();

    document.getElementById("play").addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            document.getElementById("play").src = "pause.svg";
        } else {
            currentSong.pause();
            document.getElementById("play").src = "play.svg";
        }
    });

    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    });

    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = (currentSong.duration * percent) / 100;
    });

    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    document.getElementById("previous").addEventListener("click", () => {
        currentSong.pause();
        let index = allSongs.findIndex(song => song.path === currentSong.src);
        if (index > 0) {
            playMusic(allSongs[index - 1]);
        }
    });

    document.getElementById("next").addEventListener("click", () => {
        currentSong.pause();
        let index = allSongs.findIndex(song => song.path === currentSong.src);
        if (index < allSongs.length - 1) {
            playMusic(allSongs[index + 1]);
        }
    });

    document.querySelector(".range input").addEventListener("change", e => {
        currentSong.volume = parseInt(e.target.value) / 100;
        if (currentSong.volume > 0) {
            document.querySelector(".volume>img").src = document.querySelector(".volume>img").src.replace("mute.svg", "volume.svg");
        }
    });

    document.querySelector(".volume>img").addEventListener("click", e => {
        if (e.target.src.includes("volume.svg")) {
            e.target.src = e.target.src.replace("volume.svg", "mute.svg");
            currentSong.volume = 0;
            document.querySelector(".range input").value = 0;
        } else {
            e.target.src = e.target.src.replace("mute.svg", "volume.svg");
            currentSong.volume = 0.10;
            document.querySelector(".range input").value = 10;
        }
    });

    document.getElementById("searchIcon").addEventListener("click", () => {
        document.getElementById("leftSearchBar").classList.toggle("hidden");
    });

    document.getElementById('leftSearchInput').addEventListener('input', performSearch);
}


document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const overlay = document.getElementById('overlay');

    function toggleForm(formId) {
        const form = document.getElementById(formId);
        form.classList.toggle('hidden');
        overlay.classList.toggle('hidden');
    }

    function hideForm(formId) {
        const form = document.getElementById(formId);
        form.classList.add('hidden');
        overlay.classList.add('hidden');
    }

    document.querySelector('.loginbtn').addEventListener('click', () => {
        toggleForm('loginForm');
    });

    document.querySelector('.signupbtn').addEventListener('click', () => {
        toggleForm('signupForm');
    });

    overlay.addEventListener('click', () => {
        hideForm('loginForm');
        hideForm('signupForm');
    });

    loginForm.querySelector('form').addEventListener('submit', (event) => {
        event.preventDefault();
        // Perform login logic here
        hideForm('loginForm');
    });

    signupForm.querySelector('form').addEventListener('submit', (event) => {
        event.preventDefault();
        // Perform sign-up logic here
        hideForm('signupForm');
    });
});








main();
