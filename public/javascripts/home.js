document.querySelector('#submit').addEventListener('click', (e) => {
    const endpoint = `/create-room`
    fetch(endpoint, {
        method: 'POST'
    })
    .then(response => response.json('.active-users'))
    .then(data => window.location.href = data.redirect)
    .catch(err => console.log(err))
})