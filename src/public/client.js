document.addEventListener("DOMContentLoaded", () => {
    const socket = io();
    socket.emit('user-message', '__init__');


    const sendBtn = document.getElementById('send_btn');
    const messageInput = document.getElementById('inputMessage');
    const optionsContainer = document.getElementById('options');
    const messagesContainer = document.getElementById('messages');
    const resumeInput = document.getElementById('resumeInput');
    const resumeLinkDiv = document.getElementById('resumeLink');
    const fileNameSpan = document.getElementById('fileName');

    function appendMessage(sender, text) {
        const messageWrapper = document.createElement('div');
        messageWrapper.classList.add('message-wrapper', sender.toLowerCase() === 'bot' ? 'left' : 'right');

        const avatar = document.createElement('img');
        avatar.src = sender.toLowerCase() === 'bot' ? '/bot.jpg' : '/user.jpeg';
        avatar.classList.add('avtar');

        const messageText = document.createElement('p');
        messageText.innerText = text;
        messageText.classList.add('message', sender.toLowerCase());

        messageWrapper.appendChild(avatar);
        messageWrapper.appendChild(messageText);
        messagesContainer.appendChild(messageWrapper);

        messageWrapper.scrollIntoView({ behavior: "smooth" });
    }

    function renderOptions(options) {
        optionsContainer.innerHTML = '';

        const skillKeywords = ['HTML', 'CSS', 'JavaScript', 'node-js', 'express-js', 'mongoDB', 'ejs'];
        const isSkillSelection = skillKeywords.every(skill => options.includes(skill));

        if (isSkillSelection) {
            const selectedSkills = new Set();

            for (const option of options) {
                const btn = document.createElement('button');
                btn.innerText = option;
                btn.classList.add('option-btn');

                btn.addEventListener('click', () => {
                    if (btn.classList.contains('selected')) {
                        btn.classList.remove('selected');
                        selectedSkills.delete(option);
                    } else {
                        btn.classList.add('selected');
                        selectedSkills.add(option);
                    }
                });

                optionsContainer.appendChild(btn);
            }

            const submitBtn = document.createElement('button');
            submitBtn.innerText = 'Submit Skills';
            submitBtn.classList.add('option-btn');
            submitBtn.style.marginTop = '10px';

            submitBtn.addEventListener('click', () => {
                if (selectedSkills.size === 0) {
                    alert('Please select at least one skill.');
                    return;
                }
                const skillsStr = Array.from(selectedSkills).join(', ');
                appendMessage('You', skillsStr);
                socket.emit('user-message', skillsStr);
                optionsContainer.innerHTML = '';
            });

            optionsContainer.appendChild(submitBtn);

        } else {
            for (const option of options) {
                const btn = document.createElement('button');
                btn.innerText = option;
                btn.classList.add('option-btn');

                btn.onclick = () => {
                    appendMessage('You', option);
                    socket.emit('user-message', option);
                    optionsContainer.innerHTML = '';
                };

                optionsContainer.appendChild(btn);
            }
        }
    }

    resumeInput.addEventListener('change', () => {
        const file = resumeInput.files[0];

        // Show file name
        if (file) {
            fileNameSpan.textContent = file.name;
        } else {
            fileNameSpan.textContent = 'No file chosen';
        }

        if (!file || file.type !== 'application/pdf') {
            alert('Please upload a valid PDF file!');
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            const base64PDF = e.target.result;
            appendMessage('You', 'Uploaded Resume');
            socket.emit('user-message', base64PDF);
        };
        reader.readAsDataURL(file);
    });

    sendBtn.addEventListener('click', () => {
        const msg = messageInput.value.trim();
        if (msg) {
            appendMessage('You', msg);
            socket.emit('user-message', msg);
            messageInput.value = '';
        }
    });

    socket.on('bot-message', (msg) => {
        appendMessage('Bot', msg);

        // Show resume input
        if (msg.toLowerCase().includes('please upload your resume')) {
            document.getElementById('resumeUploadSection').style.display = 'block';
            resumeInput.style.display = 'block';
        } else {
            document.getElementById('resumeUploadSection').style.display = 'none';
            resumeInput.style.display = 'none';
        }

        // Show resume link if uploaded
        if (msg.toLowerCase().includes('resume uploaded!')) {
            const url = msg.split('View: ')[1];
            const link = document.createElement('a');
            link.href = url;
            link.innerText = 'View uploaded Resume!';
            link.target = '_blank';
            resumeLinkDiv.innerHTML = '';
            resumeLinkDiv.appendChild(link);
        }
    });

    socket.on('bot-options', (options) => {
        renderOptions(options);
    });
});
