"use strict";

const form = document.getElementById("registerForm");
const message = document.getElementById("message");
const button = document.getElementById("registerButton");

const fullNameInput = document.getElementById("full_name");
const emailInput = document.getElementById("email");
const companyInput = document.getElementById("company");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirm_password");

// Show a message to the user.
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

// Submit registration details to the Flask backend.
form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessage();

    const full_name = fullNameInput.value.trim();
    const email = emailInput.value.trim().toLowerCase();
    const company = companyInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // Validate required fields.
    if (!full_name || !email || !password || !confirmPassword) {
        showMessage("Please complete all required fields.");
        return;
    }

    // Validate email format.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showMessage("Please enter a valid email address.");
        emailInput.focus();
        return;
    }

    // Validate password length.
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

    // Confirm password.
    if (password !== confirmPassword) {
        showMessage("Passwords do not match.");
        confirmPasswordInput.focus();
        return;
    }

    button.disabled = true;
    button.textContent = "Creating account...";

    try {
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
                password: password,
                company: company
            })
        });

        // Read the response safely, even if the server returns HTML.
        const responseText = await response.text();
        let result = {};

        try {
            result = responseText ? JSON.parse(responseText) : {};
        } catch {
            result = {};
        }

        if (!response.ok) {
            if (response.status === 409) {
                throw new Error(
                    result.message ||
                    result.error ||
                    "An account with this email already exists."
                );
            }

            if (response.status === 400) {
                throw new Error(
                    result.message ||
                    result.error ||
                    "Please check your registration details."
                );
            }

            if (response.status >= 500) {
                throw new Error(
                    result.message ||
                    result.error ||
                    "Server error. Please try again later."
                );
            }

            throw new Error(
                result.message ||
                result.error ||
                `Registration failed (HTTP ${response.status}).`
            );
        }

        showMessage(
            result.message ||
            "Account created successfully. Please log in.",
            "success"
        );

        form.reset();

        // Prevent duplicate submissions while redirecting.
        button.textContent = "Registration Successful";

        window.setTimeout(() => {
            window.location.href = "/login";
        }, 1500);

    } catch (error) {
        if (error instanceof TypeError) {
            showMessage(
                "Unable to connect to the server. Check your connection and try again."
            );
        } else {
            showMessage(
                error.message ||
                "An unexpected error occurred. Please try again."
            );
        }
    } finally {
        // Do not re-enable the button during the success redirect.
        if (!message.classList.contains("success")) {
            button.disabled = false;
            button.textContent = "Create Account";
        }
    }
});
