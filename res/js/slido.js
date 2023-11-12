var qrcode = new QRCode(document.getElementById("qrcode"), {
    text: document.getElementById('url').innerHTML,
    width: 128,
    height: 128,
    colorDark : "#000000",
    colorLight : "#ffffff",
    correctLevel : QRCode.CorrectLevel.H
});

function myFunction() {
document.getElementById("myDropdown").classList.toggle("show");
}

var isPlaying = false;

document.getElementById('hideControl').addEventListener('click', function() {
    document.getElementById('floatingControls').style.opacity = '0';
    setTimeout(function() {
        document.getElementById('showControl').style.opacity = '1';
    }, 500); // Show the > icon after the floating control has faded out
});

document.getElementById('showControl').addEventListener('click', function() {
    document.getElementById('showControl').style.opacity = '0';
    setTimeout(function() {
        document.getElementById('floatingControls').style.opacity = '1';
    }, 500); // Show the floating control after the > icon has faded out
});

//jQuery on the next module
$(document).ready(function() {
    $('.fa-backward').css('color','gray');
    $('.fa-forward').css('color','gray');
    var currentModule = 1;
    $("#module" + currentModule).show();
    $(".fa-forward").click(function() {
        if(currentModule >= 2 & currentModule <= 2) {
            $("#module" + currentModule).hide();
            currentModule++;
            $("#module" + currentModule).show();
            $("p").html($("#module" + currentModule).attr("name"));
        }else if(currentModule==3){
            $("#module" + currentModule).hide();
            currentModule++;
            $("#module" + currentModule).show();
            $("p").html($("#module" + currentModule).attr("name"));
            $('.fa-forward').css('color','gray');
            // $('.fa-forward').removeClass('control');
        }
    });
    $(".fa-backward").click(function() {
        if(currentModule >= 3 & currentModule<=4) {
            $("#module" + currentModule).hide();
            currentModule--;
            $("#module" + currentModule).show();
            $("p").html($("#module" + currentModule).attr("name"));
            $('.fa-backward').css('color','white');
            $('.fa-backward').addClass('control');
        }else if(currentModule == 2){
            $("#module" + currentModule).hide();
            currentModule = 1;
            $("#module" + currentModule).show();
            $("p").html($("#module" + currentModule).attr("name"));
            $('.fa-backward').css('color','gray');

            // $('.fa-backward').removeClass('control');
            $('#playButton').removeClass('fa-stop');

            $('.fa-forward').css('color','gray');
            //$('.fa-forward').removeClass('control');

            $('#playButton').addClass('fa-play');
            $('#playButton').css('color', 'white');
            
        }
    });
    $("#playButton").click(function() {
        if (isPlaying) {
            $('.fa-backward').css('color','gray');
            // $('.fa-backward').removeClass('control');
            
            $('.fa-forward').css('color','gray');
            // $('.fa-forward').removeClass('control');
            // Change the icon to 'play' and stop the content
            this.classList.remove('fas', 'fa-stop');
            this.classList.add('fas', 'fa-play');
            this.style.color = "white";

            $("#module" + currentModule).hide();
            currentModule = 1;
            $("#module" + currentModule).show();
            $("p").html($("#module" + currentModule).attr("name"));
            // // Add your code to stop the content here
            // alert("if playing");
        } else {
            $('.fa-backward').css('color','white');
            $('.fa-backward').addClass('control');
            
            $('.fa-forward').css('color','white');
            $('.fa-forward').addClass('control');
            // Change the icon to 'stop' and play the content
            this.classList.remove('fas', 'fa-play');
            this.classList.add('fas', 'fa-stop');
            this.style.color = "#00d13f";
            // fetch('/loadContent')
            //     .then(response => response.text())
            //     .then(data => {
            //         document.getElementById('loadingDock').innerHTML = data;
            //     });
            // alert("if not playing");
            $("#module" + currentModule).hide();
            currentModule++;
            $("#module" + currentModule).show();
            $("p").html($("#module" + currentModule).attr("name"));
        }
        isPlaying = !isPlaying;
    });
});

var pyramid = document.getElementById('pyramid');
var totalCircles = 60; // total number of circles
var count = 1; // Start counting from 1

// Note: This function needs to be async to use await
async function createCircles() {
    const socket = new WebSocket('ws://192.168.1.119:3000');

    socket.onopen = function(event) {
        console.log('WebSocket connection opened');
        // alert('connected');
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
        // console.log(data);
        // Update the circle with the corresponding id
        const circle = document.getElementById('circle-' + data.idno);
        if (circle) {
            if(data.status=="claimed"){
                circle.textContent = "CLAIMED";
                circle.style.fontSize = "x-small";
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
    // temporary comment since the active users are different now
    let activeUsersSet = new Set();
    let activeUsersData = {};

    socket.onmessage = function(event) {
        let activeUsers = JSON.parse(event.data);
        console.log(activeUsers);
        var userBox = document.getElementById('user-box');

        if (activeUsers.type === 'activeUsers') {
            // Create a temporary set of active users
            let tempSet = new Set();
            activeUsers.data.forEach(user => {
                tempSet.add(user.idno);
                if (!activeUsersSet.has(user.idno)) {
                    var div = document.createElement('div');
                    div.className = 'user';
                    div.textContent = user.name;
                    userBox.prepend(div);
                    setTimeout(function() {
                        div.style.display = 'block';
                    }, 10);
                    resizeFont(div);
                    activeUsersData[user.idno] = user.name;
                }
            });

            // Check for users that are no longer active and remove them
            activeUsersSet.forEach(idno => {
                if (!tempSet.has(idno)) {
                    let userDivs = Array.from(userBox.getElementsByClassName('user'));
                    userDivs.forEach(div => {
                        if (div.textContent === activeUsersData[idno]) {
                            userBox.removeChild(div);
                        }
                    });
                    delete activeUsersData[idno];
                }
            });

            // Update the set of active users
            activeUsersSet = tempSet;
            // console.log(activeUsersSet.size);
            document.getElementById('counter').innerHTML = '<i class="fas fa-user" style="font-size: 1rem;"></i> '+ activeUsersSet.size;
        }
    };
    
      for (var i = 0; count <= totalCircles; i++) {
        var row = document.createElement('div');
        row.className = 'rows';
        for (var j = 0; j <= i && count <= totalCircles; j++) {
            var circle = document.createElement('div');
            circle.id = 'circle-' + count;
            circle.className = 'circle';
            circle.textContent = count; // Set the number inside the circle
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
                        circle.style.fontSize = "x-small";
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

function resizeFont(element) {
    var fontSize = 100;
    var textLength = element.textContent.length;

    if (textLength > 10) {
        fontSize -= (textLength - 10) * 5;
    }

    element.style.fontSize = fontSize + '%';
}

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
            this.style.fontSize = '5px'; // Adjust the font size to fit inside the circle
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