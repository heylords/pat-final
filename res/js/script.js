var pyramid = document.getElementById('pyramid');
var totalCircles = 60; // total number of circles
var count = 1; // Start counting from 1

// Note: This function needs to be async to use await
async function createCircles() {
    const socket = new WebSocket('ws://localhost:3000');

    socket.onopen = function(event) {
        console.log('WebSocket connection opened');
    };

    socket.onerror = function(error) {
        console.error('WebSocket error:', error);
    };

    socket.onclose = function(event) {
        if (event.wasClean) {
            console.log(`WebSocket connection closed cleanly, code=${event.code} reason=${event.reason}`);
        } else {
            console.log('WebSocket connection died');
        }
    };

    socket.addEventListener('message', (event) => {
        const data = JSON.parse(event.data);
        //console.log(data.idno);
        // Update the circle with the corresponding id
        const circle = document.getElementById('circle-' + data.idno);
        if (circle) {
            if(data.status=="claimed"){
                circle.textContent = "CLAIMED";
                circle.style.fontSize = "small";
                circle.style.backgroundColor = "darkgreen";
                circle.classList.add('claimed');
                console.log(data.idno);
            }else{
                circle.textContent = data.idno;
                console.log(data.prize_name);
                circle.style.fontSize = "40px";
                circle.style.backgroundColor = "#b8063b";
                circle.classList.add('unclaimed');
            }
        }
    });

    socket.onmessage = function(event) {
        console.log('Message received:', event.data); // Log received message
      
        let activeUsers = JSON.parse(event.data);
        console.log('Active users:', activeUsers); // Log parsed data
      
        // Update the display of active users in the browser
        let activeUsersElement = document.getElementById('active');
        
        // Clear the current content
        activeUsersElement.innerHTML = '';

        // Add each active user
        for (let user of activeUsers) {
            let p = document.createElement('p');
            p.textContent = user.name + ' (' + user.office + ')';
            activeUsersElement.appendChild(p);
        }
      };
    
      for (var i = 0; count <= totalCircles; i++) {
        var row = document.createElement('div');
        row.className = 'row';
        for (var j = 0; j <= i && count <= totalCircles; j++) {
            var circle = document.createElement('div');
            circle.id = 'circle-' + count;
            circle.className = 'circle';
            circle.textContent = count++; // Set the number inside the circle
            circle.addEventListener('click', clickHandler);

            // pyramid.appendChild(circle);

            // Fetch the prize for the circle
            // Note: You need to use await to wait for the fetch to complete
            try {
                const response = await fetch('/getPrizeStatus', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ id: count }),
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                } else {
                    const data = await response.json();

                    if(data.status=="unclaimed"){
                        circle.textContent = count;                        
                    }else{
                        circle.textContent = "CLAIMED";
                        circle.style.fontSize = "small";
                        circle.style.backgroundColor = "darkgreen";
                        circle.classList.add('claimed');

                        // Add Bootstrap popover
                        circle.setAttribute('title', 'CLAIMED BY');
                        circle.setAttribute('data-toggle', 'popover');
                        circle.setAttribute('data-html', 'true');
                        circle.setAttribute('data-content', '<p>Name: <b>'+data.user.name+'</b><br>Prize: <b>'+data.prizes.prize_name+'</b></p><br><img src="https://tinyurl.com/IMGnodejs" width="100%">' + count);
                        circle.setAttribute('data-trigger', 'hover');
                        circle.setAttribute('data-placement', 'top');
                    }
                }
            } catch (error) {
                console.error('Error:', error);
            }
            count++;
            row.appendChild(circle);
        }
        pyramid.appendChild(row);
    }

    $(document).ready(function(){
       $('[data-toggle="popover"]').popover(); 
    });

}

// Call the function
createCircles();


function clickHandler() {
    if (this.classList.contains('claimed')) {
        // // If the circle has already been clicked, do nothing
        // // Zoom in on the circle
        // this.style.transform = 'scale(7)';
        // this.style.zIndex = '9999';

        // // Get the circle's position and dimensions
        // var rect = this.getBoundingClientRect();

        // // Calculate the center of the circle
        // var x = rect.left + rect.width / 2;
        // var y = rect.top + rect.height / 2;

        // // Convert to a value between 0 and 1 for the confetti origin
        // x /= window.innerWidth;
        // y /= window.innerHeight;

        // // Zoom out after 1 second (1000 milliseconds)
        // setTimeout(() => {
        //     this.style.transform = 'scale(1)';
        //     this.style.zIndex = '0';
        // }, 1000);
        return;
    }
    var id = this.textContent;

    //for inspect elemement people
    fetch('/getPrize', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: id}),
    })
    .then(response => response.text())
    .then(data => {
        if (data === 'updated') {
            //alert('The prize has been claimed successfully.');
            this.textContent = ''; // Remove the number
            this.style.fontSize = '10px'; // Adjust the font size to fit inside the circle
            this.style.color = 'white'; // Change the text color to black for visibility
            this.style.backgroundColor = 'darkgreen'; // Change the background color to green
            this.style.border = '2px solid white'; // Add a blue border
            this.textContent = "CLAIMED";

            // Zoom in on the circle
            this.style.transform = 'scale(7)';
            this.style.zIndex = '9999';

            // Get the circle's position and dimensions
            var rect = this.getBoundingClientRect();

            // Calculate the center of the circle
            var x = rect.left + rect.width / 2;
            var y = rect.top + rect.height / 2;

            // Convert to a value between 0 and 1 for the confetti origin
            x /= window.innerWidth;
            y /= window.innerHeight;

            // Add confetti animation at the circle's center
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { x: x, y: y } // Updated origin
            });         

            // Zoom out after 1 second (1000 milliseconds)
            setTimeout(() => {
                this.style.transform = 'scale(1)';
                this.style.zIndex = '0';
            }, 1000);
        }else if(data === 'claimed'){
            alert('You have already claimed a prize. Give chance to others');
            return;
        } else {
            alert('The prize is either already claimed.');
            return;
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });

    //console.log(this.textContent);
    
}

function fetchPrize(id) {
    return fetch('/getPrizeStatus', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: id.toString() }), // Ensure the id is a string
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    });
}
