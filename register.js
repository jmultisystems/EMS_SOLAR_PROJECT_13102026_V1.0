
const form = document.getElementById("registerForm");
const message = document.getElementById("message");
const button = document.getElementById("registerButton");

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const full_name = document.getElementById("full_name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword =
        document.getElementById("confirm_password").value;

    message.textContent = "";

    if (password !== confirmPassword) {
        message.textContent = "Passwords do not match.";
        return;
    }

    if (password.length < 8) {
        message.textContent =
            "Password must contain at least 8 characters.";
        return;
    }

    button.disabled = true;
    button.textContent = "Registering...";

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
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message || result.error ||
                "Registration failed. Please try again."
            );
        }

        message.textContent =
            "Registration successful! You can now log in.";

        form.reset();
    } catch (error) {
        message.textContent =
            error.message === "Failed to fetch"
                ? "Cannot connect to the API. Please check the backend deployment."
                : error.message;
    } finally {
        button.disabled = false;
        button.textContent = "Register";
    }
});
