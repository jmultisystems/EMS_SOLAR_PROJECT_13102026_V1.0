
"use strict";

const form = document.getElementById("registerForm");
const message = document.getElementById("message");
const button = document.getElementById("registerButton");

const fullNameInput = document.getElementById("full_name");
const emailInput = document.getElementById("email");
const companyInput = document.getElementById("company");
const passwordInput = document.getElementById("password");
const confirmPasswordInput =
    document.getElementById("confirm_password");

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

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessage();

    const full_name = fullNameInput.value.trim();
    const email = emailInput.value.trim().toLowerCase();
    const company = companyInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (!full_name || !email || !password) {
        showMessage("Please complete all required fields.");
        return;
    }

    if (password.length < 12) {
        showMessage(
            "Your password must contain at least 12 characters."
        );
        passwordInput.focus();
        return;
    }

    if (password.length > 128) {
        showMessage("Your password is too long.");
        passwordInput.focus();
        return;
    }

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
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                full_name,
                email,
                password
                // Company is not yet stored by the current Flask model.
            })
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(
                result.error ||
                result.message ||
                `Registration failed (HTTP ${response.status}).`
            );
        }

        showMessage(
            result.message ||
            "Account created successfully. Please log in.",
            "success"
        );

        form.reset();

        // Allow the success message to appear before redirecting.
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
        button.disabled = false;
        button.textContent = "Create Account";
    }
});
