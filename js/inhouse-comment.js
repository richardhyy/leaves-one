var postId = 'null';
var apiURL = 'https://api.eumc.cc/comment/';
var commentContainerID = 'comments-list';
var submissionResultContainerID = 'comment-submission-result'; // Error: #comment-submission-result.error; Success: #comment-submission-result.success
var submitButtonID = 'comment-submit-button';

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

            const content = document.createElement('p');
            content.textContent = decodeHtmlSpecialChars(comment.content);

            commentElement.appendChild(username);
            commentElement.appendChild(timestamp);
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
    const submitButtonOriginalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Please wait...';

    try {
        const response = await fetch(`${apiURL}?id=${postId}`, {
            method: 'POST',
            body: payload
        });

        if (response.status === 201) {
            fetchComments();
            document.getElementById('comment-form').reset();
            grecaptcha.reset();

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
    submitButton.textContent = submitButtonOriginalText;
}
