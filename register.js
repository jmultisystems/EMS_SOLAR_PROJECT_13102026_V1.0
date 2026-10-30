
"use strict";

// --------------------------------------------------
// 1. HTML Elements
// --------------------------------------------------

const form = document.getElementById("registerForm");
const message = document.getElementById("message");
const button = document.getElementById("registerButton");

const fullNameInput = document.getElementById("full_name");
const emailInput = document.getElementById("email");
const companyInput = document.getElementById("company_name");

const otpSection = document.getElementById("otpSection");
const otpInput = document.getElementById("otp");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirm_password");
const resendOtpButton = document.getElementById("resendOtpButton");

// Registration state
let otpRequested = false;
let registrationCompleted = false;

// --------------------------------------------------
// 2. Message Functions
// --------------------------------------------------

function showMessage(text, type = "error") {
    message.textContent = text;
    message.className = `message ${type}`;
    message.hidden = false;
}

function clearMessage() {
    message.textContent = "";
    message.className = "message";
    message.hidden = true;
}

// --------------------------------------------------
// 3. API Request Function
// --------------------------------------------------

async function apiRequest(url, data) {
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        credentials: "same-origin",
        body: JSON.stringify(data)
    });

    const responseText = await response.text();

    let result = {};

    try {
        result = responseText ? JSON.parse(responseText) : {};
    } catch {
        throw new Error("Invalid response received from the server.");
    }

    if (!response.ok) {
        throw new Error(
            result.error ||
            result.message ||
            `Request failed (HTTP ${response.status}).`
        );
    }

    return result;
}

// --------------------------------------------------
// 4. Validate Basic Registration Details
// --------------------------------------------------

function validateBasicDetails() {
    const full_name = fullNameInput.value.trim();
    const email = emailInput.value.trim().toLowerCase();
    const company_name = companyInput.value.trim();

    if (!full_name || !email) {
        showMessage("Please enter your full name and email address.");
        return false;
    }

    if (full_name.length > 100) {
        showMessage("Full name must not exceed 100 characters.");
        fullNameInput.focus();
        return false;
    }

    if (company_name.length > 150) {
        showMessage("Company name must not exceed 150 characters.");
        companyInput.focus();
        return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showMessage("Please enter a valid email address.");
        emailInput.focus();
        return false;
    }

    return true;
}

// --------------------------------------------------
// 5. Request OTP
// --------------------------------------------------

async function requestOtp() {
    if (!validateBasicDetails()) {
        return;
    }

    button.disabled = true;
    button.textContent = "Sending OTP...";

    try {
        const result = await apiRequest(
            "/api/request-registration-otp",
            {
                full_name: fullNameInput.value.trim(),
                email: emailInput.value.trim().toLowerCase(),
                company_name: companyInput.value.trim()
            }
        );

        otpRequested = true;

        // Lock identity details after OTP request
        fullNameInput.readOnly = true;
        emailInput.readOnly = true;
        companyInput.readOnly = true;

        // Enable OTP and password fields
        otpSection.hidden = false;

        otpInput.disabled = false;
        passwordInput.disabled = false;
        confirmPasswordInput.disabled = false;

        otpInput.required = true;
        passwordInput.required = true;
        confirmPasswordInput.required = true;

        resendOtpButton.hidden = false;

        button.textContent = "Verify OTP & Create Account";

        showMessage(
            result.message ||
            "OTP sent to the Jove EMS Admin. Please obtain the approval code from the Admin.",
            "success"
        );

        otpInput.focus();

    } catch (error) {
        console.error("OTP request error:", error);

        showMessage(
            error.message ||
            "Unable to send OTP. Please try again."
        );

    } finally {
        if (!otpRequested) {
            button.disabled = false;
            button.textContent = "Request OTP";
        } else {
            button.disabled = false;
        }
    }
}

// --------------------------------------------------
// 6. Verify OTP and Create Account
// --------------------------------------------------

async function verifyOtpAndCreateAccount() {
    const otp = otpInput.value.trim();
    const password = passwordInput.value;
    const confirm_password = confirmPasswordInput.value;

    if (!/^[0-9]{6}$/.test(otp)) {
        showMessage("Please enter a valid 6-digit OTP.");
        otpInput.focus();
        return;
    }

    if (password.length < 12) {
        showMessage("Your password must contain at least 12 characters.");
        passwordInput.focus();
        return;
    }

    if (password.length > 128) {
        showMessage("Your password is too long.");
        passwordInput.focus();
        return;
    }

    if (password !== confirm_password) {
        showMessage("Passwords do not match.");
        confirmPasswordInput.focus();
        return;
    }

    button.disabled = true;
    resendOtpButton.disabled = true;
    button.textContent = "Verifying OTP...";

    try {
        const result = await apiRequest(
            "/api/verify-registration-otp",
            {
                full_name: fullNameInput.value.trim(),
                email: emailInput.value.trim().toLowerCase(),
                company_name: companyInput.value.trim(),
                otp: otp,
                password: password,
                confirm_password: confirm_password
            }
        );

        registrationCompleted = true;

        showMessage(
            result.message ||
            "Account created successfully. Please log in.",
            "success"
        );

        form.reset();

        window.setTimeout(() => {
            window.location.href = "/login";
        }, 1800);

    } catch (error) {
        console.error("Registration verification error:", error);

        showMessage(
            error.message ||
            "OTP verification failed. Please try again."
        );

    } finally {
        if (!registrationCompleted) {
            button.disabled = false;
            resendOtpButton.disabled = false;
            button.textContent = "Verify OTP & Create Account";
        }
    }
}

// --------------------------------------------------
// 7. Form Submission
// --------------------------------------------------

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessage();

    if (!otpRequested) {
        await requestOtp();
    } else {
        await verifyOtpAndCreateAccount();
    }
});

// --------------------------------------------------
// 8. Resend OTP
// --------------------------------------------------

resendOtpButton.addEventListener("click", async () => {
    clearMessage();

    if (!validateBasicDetails()) {
        return;
    }

    resendOtpButton.disabled = true;
    resendOtpButton.textContent = "Sending...";

    try {
        const result = await apiRequest(
            "/api/request-registration-otp",
            {
                full_name: fullNameInput.value.trim(),
                email: emailInput.value.trim().toLowerCase(),
                company_name: companyInput.value.trim()
            }
        );

        otpInput.value = "";

        showMessage(
            result.message ||
            "A new OTP has been sent to the Admin.",
            "success"
        );

        otpInput.focus();

    } catch (error) {
        console.error("Resend OTP error:", error);

        showMessage(
            error.message ||
            "Unable to resend OTP. Please try again."
        );

    } finally {
        resendOtpButton.disabled = false;
        resendOtpButton.textContent = "Resend OTP";
    }
});
