document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

//=============================================================================
function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Fetch emails
  fetch('/emails/inbox')
  .then(response => response.json())
  .then(emails => {
    for (let email of emails) {
      console.log(email);
      let tr = document.createElement('tr');
    
      let sender = email['sender']
      let subject = email['subject']
      let date = email['timestamp']

      let senderTD = document.createElement('td');
      senderTD.innerHTML = sender;
      tr.appendChild(senderTD);
      let subjectTD = document.createElement('td');
      subjectTD.innerHTML = subject;
      tr.appendChild(subjectTD);
      let dateTD = document.createElement('td');
      dateTD.innerHTML = date;
      tr.appendChild(dateTD);

      document.querySelector('#mails').appendChild(tr);
    }
  })

}