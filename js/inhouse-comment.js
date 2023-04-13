var postId = 'null';
var apiURL = 'https://api.eumc.cc/comment/';
var commentContainerID = 'comments-list';
var submissionResultContainerID = 'comment-submission-result'; // Error: #comment-submission-result.error; Success: #comment-submission-result.success
var submitButtonID = 'comment-submit-button';
var submitButtonOriginalText = document.getElementById(submitButtonID).innerText;
var rememberMeCheckboxID = 'remember-me';
var contentInputID = 'content';

function decodeHtmlSpecialChars(encodedString) {
    const parser = new DOMParser();
    const dom = parser.parseFromString(`<!doctype html><body>${encodedString}`, 'text/html');
    return dom.body.textContent;
}

async function fetchComments() {
    try {
        const response = await fetch(`${apiURL}?id=${postId}`);
        const comments = await response.json();

        const commentsList = document.getElementById(commentContainerID);
        commentsList.innerHTML = '';

        comments.forEach(comment => {
            const commentElement = document.createElement('div');
            commentElement.className = 'comment';

            const username = document.createElement('span');
            username.className = 'comment-username';
            username.textContent = comment.username;

            const timestamp = document.createElement('span');
            timestamp.className = 'comment-timestamp';
            timestamp.textContent = new Date(comment.timestamp * 1000).toLocaleString();

            const replyButton = document.createElement('button');
            replyButton.className = 'comment-reply-button';
            replyButton.title = `Reply to ${comment.username}`;
            replyButton.onclick = () => replyToComment(comment.username);

            const content = document.createElement('p');
            content.textContent = decodeHtmlSpecialChars(comment.content);

            commentElement.appendChild(username);
            commentElement.appendChild(timestamp);
            commentElement.appendChild(replyButton);
            commentElement.appendChild(content);
            commentsList.appendChild(commentElement);
        });
    } catch (error) {
        console.error('Error fetching comments:', error);
    }
}

async function submitComment(token) {
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const content = document.getElementById('content').value;
    const captcha = token;

    const payload = new FormData();
    payload.append('username', username);
    payload.append('email', email);
    payload.append('content', content);
    payload.append('g-recaptcha-response', captcha);

    const resultDisplay = document.getElementById(submissionResultContainerID);
    resultDisplay.style.display = 'none';
    const submitButton = document.getElementById(submitButtonID);
    submitButton.disabled = true;
    submitButton.innerText = 'Submitting...';

    try {
        const response = await fetch(`${apiURL}?id=${postId}`, {
            method: 'POST',
            body: payload
        });

        if (response.status === 201) {
            saveAccountInfo(); // Save account info on success
            document.getElementById('content').value = '';
            grecaptcha.reset();

            fetchComments();

            resultDisplay.style.display = 'block';
            resultDisplay.textContent = 'Comment submitted successfully.';
            resultDisplay.className = 'success';

        } else {
            const errorData = await response.json();
            console.error(errorData)
            console.error('Error submitting comment:', errorData.error);

            resultDisplay.style.display = 'block';
            resultDisplay.textContent = errorData.error;
            resultDisplay.className = 'error';
        }
    } catch (error) {
        console.error('Error submitting comment:', error);

        resultDisplay.style.display = 'block';
        resultDisplay.textContent = 'An error occurred while submitting the comment:\n' + error;
        resultDisplay.className = 'error';
    }
    
    submitButton.disabled = false;
    submitButton.innerText = submitButtonOriginalText;
}

function replyToComment(username) {
    const content = document.getElementById(contentInputID);
    content.value = `@${username} ` + content.value;
    content.focus();
}

// MARK: - Cookie Related Functions

function setCookie(name, value, days) {
    let expires = '';
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = '; expires=' + date.toUTCString();
    }
    document.cookie = name + '=' + encodeURIComponent(value) + expires + '; path=/';
}

function getCookie(name) {
    const nameEQ = name + '=';
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        let c = cookies[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1, c.length);
        }
        if (c.indexOf(nameEQ) === 0) {
            return decodeURIComponent(c.substring(nameEQ.length, c.length));
        }
    }
    return null;
}

function deleteCookie(name) {
    setCookie(name, '', -1);
}

function saveAccountInfo() {
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const rememberMe = document.getElementById(rememberMeCheckboxID).checked;

    if (rememberMe) {
        setCookie('username', username, 365);
        setCookie('email', email, 365);
    } else {
        deleteCookie('username');
        deleteCookie('email');
    }
}

function loadAccountInfo() {
    const username = getCookie('username');
    const email = getCookie('email');

    if (username) {
        document.getElementById('username').value = username;
    }
    if (email) {
        document.getElementById('email').value = email;
    }
}

loadAccountInfo();
