let xDown = null;
let invitees = [];
let currentIndex = 0; // kept but no longer used for slide movement
let isPlaying = false;
let selectedInvitee = null;

const music = document.getElementById("background-music");
const musicButton = document.getElementById("music-button");
const weddingDate = new Date("July 19, 2025 18:30:00").getTime();

let GroomName = "Dani";
let BrideName = "Eliane";


// keep hardcoded const for testing
let encodedKey = "Whvw#Idplo|";
invitees = [
    { name: "Test Family", rsvp: "Pending", maxGuests: 2, confirmedGuests: 0 },
    { name: "Bob Smith", rsvp: "Confirmed", maxGuests: 1, confirmedGuests: 1 },
    { name: "Charlie Brown", rsvp: "Pending", maxGuests: 0, confirmedGuests: 0 }
];

document.addEventListener("DOMContentLoaded", () => {
    startCountdown();
    const el = document.getElementById("couple-names");
    if (el) {
        el.textContent = `${GroomName} & ${BrideName}`;
        if (el.nodeName === "TITLE") {
            document.title = `${GroomName} & ${BrideName} Wedding Invitation`;
        }
    }
    // RSVP button listener (make sure #rsvp exists in DOM)
    const rsvpBtn = document.querySelector("#rsvp button");
    if (rsvpBtn) rsvpBtn.addEventListener("click", openModal);

    fetchInvitees();
});


async function fetchInvitees() {
    // show UI while data is loading
    hideLoadingScreen();

    // If you later enable real fetch, keep it here
    // try {
    //   const response = await fetch('[AppScriptUrl]');
    //   invitees = await response.json();
    // } catch (error) {
    //   console.error("Error fetching invitees:", error);
    //   showErrorScreen();
    //   return;
    // }

    checkGuestFromURL();
}

function checkGuestFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    // let encodedKey = urlParams.get("key");
    console.log("Encoded Key:", encodedKey);

    if (!encodedKey) return showErrorScreen();

    encodedKey = decodeURIComponent(encodedKey);
    const guestName = decodeName(encodedKey);
    console.log("Decoded Guest Name:", guestName);

    const foundInvitee = invitees.find(inv => inv.name === guestName);

    if (foundInvitee) {
        selectedInvitee = foundInvitee;
        // keep intro visible until they click start
    } else {
        showErrorScreen();
    }
}

/* =========
   NEW UX FLOW
   ========= */
function firstSlide() {
    // Start music in a user gesture (allowed by browsers)
    if (!isPlaying) {
        toggleMusic();
    }

    // Hide intro screen
    const intro = document.getElementById("intro-screen");
    if (intro) intro.classList.add("hidden");

    // Show scroll page
    const scrollPage = document.getElementById("scrollPage");
    if (scrollPage) scrollPage.style.display = "block";

    // Optional: show sticky countdown after intro (your choice)
    // document.getElementById("sticky-countdown").style.display = "block";

    // Start at top of content
    window.scrollTo({ top: 0, behavior: "instant" });
}

/* =========
   MUSIC
   ========= */
function toggleMusic() {
    if (isPlaying) {
        music.pause();
        musicButton.innerHTML = '<i class="fas fa-play"></i>';
    } else {
        music.play();
        musicButton.innerHTML = '<i class="fas fa-pause"></i>';
    }
    isPlaying = !isPlaying;
}

/* =========
   RSVP MODAL
   ========= */
function openModal() {
    if (selectedInvitee) {
        showGuest(selectedInvitee);
    }
    document.getElementById("rsvp-modal").style.display = "flex";
}

function closeModal() {
    document.getElementById("rsvp-modal").style.display = "none";
}

function showGuest(invitee) {
    selectedInvitee = invitee;
    const modal = document.getElementById("rsvp-modal");
    const nameField = document.getElementById("selected-name");
    const guestCountDiv = document.getElementById("guest-count");
    const confirmBtn = document.getElementById("confirm-button");

    nameField.textContent = `RSVP for ${invitee.name}`;

    if (invitee.rsvp === "Confirmed") {
        guestCountDiv.style.display = "none";
        confirmBtn.style.display = "none";
        nameField.innerHTML = `${invitee.name} confirmed for ${invitee.confirmedGuests} guest${invitee.confirmedGuests > 1 ? "s" : ""}`;
    } else {
        if (invitee.maxGuests > 0) {
            guestCountDiv.style.display = "block";
            document.getElementById("guest-number").value = invitee.maxGuests;
            document.getElementById("guest-number").max = invitee.maxGuests;
            document.getElementById("guest-limit").textContent = `${invitee.maxGuests} guests`;
        } else {
            guestCountDiv.style.display = "none";
        }
        confirmBtn.style.display = "block";
    }

    modal.style.display = "flex";
}

function confirmRSVP() {
    if (!selectedInvitee) return;

    const rsvpResponse = "Confirmed";
    let guestCount = 0;

    if (selectedInvitee.maxGuests > 0) {
        guestCount = parseInt(document.getElementById("guest-number").value, 10);
        if (!guestCount || guestCount <= 0 || guestCount > selectedInvitee.maxGuests) {
            showConfirmationPopup(`Please enter a valid number of guests (Max: ${selectedInvitee.maxGuests}).`, true);
            return;
        }
    }

    const confirmBtn = document.getElementById("confirm-button");
    confirmBtn.disabled = true;
    confirmBtn.textContent = "Submitting...";
    spawnHearts();

    fetch("[AppScriptUrl]", {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: selectedInvitee.name,
            response: rsvpResponse,
            guestCount: guestCount
        })
    })
        .then(() => {
            const message = `Thank you for your confirmation!<br>We can't wait to celebrate with you ♡`;
            showConfirmationPopup(message);
            selectedInvitee.confirmedGuests = guestCount;
            selectedInvitee.rsvp = rsvpResponse;
            closeModal();
        })
        .catch(() => {
            showConfirmationPopup("Something went wrong. Please try again.", true);
        })
        .finally(() => {
            confirmBtn.disabled = false;
            confirmBtn.textContent = "Confirm";
        });
}

function showConfirmationPopup(message, isError = false) {
    const modal = document.getElementById("rsvp-confirm-modal");
    const messageElement = document.getElementById("confirmation-message");

    messageElement.innerHTML = message;
    messageElement.style.color = isError ? "red" : "black";
    modal.style.display = "flex";
}

function closeConfirmationModal() {
    document.getElementById("rsvp-confirm-modal").style.display = "none";
}

function decodeName(encodedName) {
    return encodedName
        .split("")
        .map(char => String.fromCharCode(((char.charCodeAt(0) - 3 - 32 + 95) % 95) + 32))
        .join("");
}

/* =========
   LOADING
   ========= */
function hideLoadingScreen() {
    const loadingScreen = document.getElementById("loading-screen");
    loadingScreen.style.opacity = "0";
    document.getElementById("slides").style.display = "block";
    setTimeout(() => {
        loadingScreen.style.display = "none";
    }, 500);
}

/* =========
   ERROR SCREEN
   ========= */
function showErrorScreen() {
    document.body.innerHTML = `
    <div class="background-wrapper">
      <video class="background-video" autoplay loop muted playsinline>
        <source src="background.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <div class="background-overlay"></div>
    </div>
    <div class="error-screen">
      <div class="error-content">
        <h1>Oops! This link is invalid.</h1>
        <p>Please contact us for assistance.</p>
        <div class="buttons">
          <a href="https://wa.me/[GroomPhoneNumber]?text=Hello%2C%20I%20need%20help%20with%20my%20invitation%20link." class="contact-btn">Contact [GroomName]</a>
          <a href="https://wa.me/[BridePhoneNumber]?text=Hello%2C%20I%20need%20help%20with%20my%20invitation%20link." class="contact-btn">Contact [BrideName]</a>
        </div>
      </div>
    </div>
  `;

    const style = document.createElement("style");
    style.innerHTML = `
    .error-screen {
      width: 100vw;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      color: white;
    }
    .error-content {
      background: rgba(0, 0, 0, 0.7);
      padding: 20px;
      border-radius: 10px;
      width: 80%;
      max-width: 400px;
    }
    .buttons {
      display: flex;
      flex-direction: column;
      gap: 15px;
      align-items: center;
    }
    .contact-btn {
      width: 100%;
      max-width: 250px;
      text-align: center;
      padding: 12px 20px;
      font-size: 1.2rem;
      background: white;
      color: black;
      border: none;
      border-radius: 30px;
      cursor: pointer;
      transition: background 0.3s, color 0.3s;
      text-decoration: none;
      font-weight: bold;
    }
  `;
    document.head.appendChild(style);
}

/* =========
   GUEST COUNTER
   ========= */
function decreaseGuest() {
    let guestInput = document.getElementById("guest-number");
    let minGuests = parseInt(guestInput.min, 10) || 1;
    let currentValue = parseInt(guestInput.value, 10) || minGuests;

    if (currentValue > minGuests) guestInput.value = currentValue - 1;
}

function increaseGuest() {
    let guestInput = document.getElementById("guest-number");
    let maxGuests = parseInt(guestInput.max, 10) || 10;
    let currentValue = parseInt(guestInput.value, 10) || 1;

    if (currentValue < maxGuests) guestInput.value = currentValue + 1;
}

/* =========
   COUNTDOWN
   ========= */
function startCountdown() {
    const countdownTimerElem = document.getElementById("countdown-timer");
    if (!countdownTimerElem) return;

    const timerInterval = setInterval(() => {
        const now = new Date().getTime();
        const distance = weddingDate - now;

        if (distance <= 0) {
            clearInterval(timerInterval);
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        countdownTimerElem.innerHTML = `
      <div><strong>${days}</strong><br>Days</div>
      <div><strong>${hours}</strong><br>Hours</div>
      <div><strong>${minutes}</strong><br>Min</div>
      <div><strong>${seconds}</strong><br>Sec</div>
    `;
    }, 1000);
}

/* =========
   HEARTS
   ========= */
function spawnHearts(count = 10) {
    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            const heart = document.createElement("div");
            heart.className = "heart";

            const leftOffset = 40 + Math.random() * 20;
            heart.style.left = `${leftOffset}%`;
            heart.style.fontSize = `${22 + Math.random() * 14}px`;
            heart.style.transform = `rotate(${Math.random() * 40 - 20}deg)`;

            const emojis = ["💗", "💖", "💕", "💞"];
            heart.textContent = emojis[Math.floor(Math.random() * emojis.length)];

            document.body.appendChild(heart);
            setTimeout(() => heart.remove(), 2500);
        }, i * 250);
    }
}
