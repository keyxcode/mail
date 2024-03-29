let emailsView;
let mailView;
let composeView;
let feedback;

document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // Send email
  document.querySelector('#compose-form').addEventListener('submit', e => {
    e.preventDefault();
    send_mail();
  })

  // Some global vars
  emailsView = document.querySelector('#emails-view');
  mailView = document.querySelector('#mail-view');
  composeView = document.querySelector('#compose-view');
  feedback = document.querySelector('#feedback');

  // By default, load the inbox
  load_mailbox('inbox');
});

//=============================================================================
function compose_email() {

  // Clear feedback
  feedback.style.display = 'none';

  // Show compose view and hide other views
  emailsView.style.display = 'none';
  mailView.style.display = 'none';
  composeView.style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-recipients').disabled = false;
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

//=============================================================================
function send_mail() {

  // POST the email to the server
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: document.querySelector('#compose-recipients').value,
        subject: document.querySelector('#compose-subject').value,
        body: document.querySelector('#compose-body').value
    })
  })
  .then(response => response.json())
  .then(result => {
    if (result['error']) {
      compose_email();
      update_feedback(`${result['error']}`, 'alert-danger');
    } else if (result['message']) {
      load_mailbox('sent');
      update_feedback(`${result['message']}`, 'alert-success');
    }
  });
}

//=============================================================================
function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  emailsView.style.display = 'block';
  mailView.style.display = 'none';
  composeView.style.display = 'none';

  // Clear feedback
  feedback.style.display = 'none';

  // Clear previous mails view
  document.querySelector('#mails').innerHTML = '';

  // Show the mailbox name
  document.querySelector('#mailbox-name').innerHTML = `${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}`;

  // Change the first col header (To for Sent box, From for others)
  document.querySelector('#from-to').innerHTML = (mailbox === 'sent') ? 'To' : 'From';

  // GET emails
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    // If the mail box is empty, feedback and don't proceed
    console.log(emails);
    if (emails.length === 0) {
      document.querySelector("#mails-header").style.display = 'none';
      update_feedback('It\'s empty here!', 'alert-secondary');
      return;
    }

    // If there are mails, show 'em
    document.querySelector("#mails-header").style.display = 'table-header-group';
    
    for (let email of emails) {
      console.log(email);

      // Grab email info
      let id = email['id'];
      let sender = email['sender'];
      let recipients = email['recipients'];
      let subject = email['subject'];
      let body = email['body'];
      let date = email['timestamp'];
      let isRead = email['read'];

      // Create a clickable e-mail srow (highlighted if read)
      let tr = document.createElement('tr');
      tr.addEventListener('click', function() {
        load_mail(id);
      })
      tr.classList.add('d-flex')
      if (isRead) {
        tr.classList.add('table-active');
      }

      // Create key info td for each row
      key_infos = (mailbox === 'sent') ? [recipients, subject, date] : [sender, subject, date]
      key_infos.forEach(info => {
        // Create each column data
        let td = document.createElement('td');
        td.innerHTML = info;
        
        // Different treatment for each td
        if (info === subject) {
          td.innerHTML += `- <span class="text-muted">${body}</span>`;
          td.classList.add('col-6');
        }
        if (info === date) {
          td.classList.add('font-italic', 'text-muted');
          td.classList.add('col-3');
        }
        if (info === recipients || info === sender) {
          td.classList.add('col-3');
        }

        // Add to row
        tr.appendChild(td);
      });

      // Add the row to mails body
      document.querySelector('#mails').appendChild(tr);
    }
  })
}

//=============================================================================
function update_feedback(message, alert_class) {
  feedback.style.display = 'block';
  feedback.innerHTML = message;
  feedback.classList.add(alert_class);
}

//=============================================================================
function load_mail(id) {

  // Show the mail and hide other views
  emailsView.style.display = 'none';
  mailView.style.display = 'block';
  composeView.style.display = 'none';

  // Clear feedback
  feedback.style.display = 'none';

  // Fetch email
  fetch(`emails/${id}`)
  .then(response => response.json())
  .then(result => {
    // Gather some info
    let sender = result['sender'];
    let recipients = result['recipients'];
    let subject = result['subject'];
    let date = result['timestamp'];
    let body = result['body'];
    let isRead = result['read'];
    let isArchived = result['archived'];

    document.querySelector('#mail-from').innerHTML = sender;
    document.querySelector('#mail-to').innerHTML = recipients;
    document.querySelector('#mail-subject').innerHTML = subject;
    document.querySelector('#mail-date').innerHTML = date;
    document.querySelector('#mail-body').innerText = body;

    // If this e-mail is not read, mark it as read
    if (!isRead) {
      fetch(`emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          read: true
        })
      })
    }

    // Reset buttons area
    let mailButtons = document.querySelector('#mail-buttons');
    mailButtons.innerHTML = '';

    // If this is not in the Sent mailbox, add archive button
    let user = document.querySelector('#user').innerText;
    if (sender != user) {

      // Add reply button
      let reply_button = document.createElement('button');
      reply_button.classList.add('btn', 'btn-outline-primary');
      reply_button.innerHTML = 'Reply';
      reply_button.addEventListener('click', () => {
        reply(sender, subject, date, body);
      })
      mailButtons.appendChild(reply_button)

      // Add archive button
      let archive_button = document.createElement('button');
      archive_button.classList.add('btn', 'btn-outline-secondary', 'ml-3');
      archive_button.innerHTML = isArchived ? 'Unarchive' : 'Archive';
      archive_button.addEventListener('click', () => {
        fetch(`emails/${id}`, {
          method: 'PUT',
          body: JSON.stringify({
            archived: !isArchived
          })
        })
        .then(() => {load_mailbox('inbox');})
      })
      mailButtons.appendChild(archive_button)      
    }
  } )
}

//=============================================================================
function reply(original_sender, subject, date, body) {
  
  compose_email();

  // Pre-fill info
  document.querySelector('#compose-recipients').value = original_sender;
  document.querySelector('#compose-recipients').disabled = true;
  document.querySelector('#compose-subject').value = (subject.startsWith('Re')) ? subject : `Re: ${subject}`;
  document.querySelector('#compose-body').value = `\n\n>> On ${date} ${original_sender} wrote:\n ${body}`;
}