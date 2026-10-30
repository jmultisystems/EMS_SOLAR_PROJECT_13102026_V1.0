
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
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirm_password");

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
// 3. Registration Form Submission
// --------------------------------------------------

form.addEventListener("submit", async (event) => {

    event.preventDefault();
    clearMessage();

    // Collect form values
    const full_name = fullNameInput.value.trim();
    const email = emailInput.value.trim().toLowerCase();
    const company_name = companyInput.value.trim();
    const password = passwordInput.value;
    const confirm_password = confirmPasswordInput.value;

    // --------------------------------------------------
    // 4. Frontend Validation
    // --------------------------------------------------

    if (!full_name || !email || !password || !confirm_password) {
        showMessage("Please complete all required fields.");
        return;
    }

    if (full_name.length > 100) {
        showMessage("Full name must not exceed 100 characters.");
        fullNameInput.focus();
        return;
    }

    if (company_name.length > 150) {
        showMessage("Company name must not exceed 150 characters.");
        companyInput.focus();
        return;
    }

    // Email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showMessage("Please enter a valid email address.");
        emailInput.focus();
        return;
    }

    // Password validation
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

    // Confirm password validation
    if (password !== confirm_password) {
        showMessage("Passwords do not match.");
        confirmPasswordInput.focus();
        return;
    }

    // --------------------------------------------------
    // 5. Disable Submit Button
    // --------------------------------------------------

    button.disabled = true;
    button.textContent = "Creating account...";

    try {

        // --------------------------------------------------
        // 6. Send Registration Request
        // --------------------------------------------------

        const response = await fetch("/api/register", {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },

            credentials: "same-origin",

            body: JSON.stringify({
                full_name: full_name,
                email: email,
                company_name: company_name,
                password: password,
                confirm_password: confirm_password
            })
        });

        // --------------------------------------------------
        // 7. Process Backend Response
        // --------------------------------------------------

        const responseText = await response.text();

        let result = {};

        try {
            result = responseText ? JSON.parse(responseText) : {};
        } catch {
            result = {};
        }

        if (!response.ok) {

            throw new Error(
                result.error ||
                result.message ||
                `Registration failed (HTTP ${response.status}).`
            );
        }

        // --------------------------------------------------
        // 8. Registration Success
        // --------------------------------------------------

        showMessage(
            result.message ||
            "Account created successfully. Please log in.",
            "success"
        );

        form.reset();

        button.textContent = "Registration Successful";

        // Redirect to login page
        window.setTimeout(() => {
            window.location.href = "/login";
        }, 1500);

    } catch (error) {

        console.error("Registration error:", error);

        if (error instanceof TypeError) {

            showMessage(
                "Unable to connect to the server. Please check your connection."
            );

        } else {

            showMessage(
                error.message ||
                "An unexpected error occurred. Please try again."
            );
        }

    } finally {

        // Keep button disabled after successful registration
        if (!message.classList.contains("success")) {

            button.disabled = false;
            button.textContent = "Create Account";

        }
    }

});
