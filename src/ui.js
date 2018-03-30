// Define UI elements
let ui = {
    timer: document.getElementById('timer'),
    robotState: document.getElementById('robot-state').firstChild,
    gyro: {
        container: document.getElementById('gyro'),
        val: 0,
        offset: 0,
        visualVal: 0,
        arm: document.getElementById('gyro-arm'),
        number: document.getElementById('gyro-number')
    },
    robotDiagram: {
        arm: document.getElementById('robot-arm')
    },
    example: {
        button: document.getElementById('example-button'),
        readout: document.getElementById('example-readout').firstChild
    },
    autoSelect: document.getElementById('auto-select'),
    armPosition: document.getElementById('arm-position'),
    armText: document.getElementById('arm-text'),
    robotCurrent: document.getElementById('robot-current'),
    robotEnergy: document.getElementById('robot-energy'),
    robotPower: document.getElementById('robot-power'),
    camera: document.getElementById('camera')
};

// Key Listeners

// Gyro rotation
let updateGyro = (key, value) => {
    ui.gyro.val = value;
    ui.gyro.visualVal = Math.floor(ui.gyro.val - ui.gyro.offset);
    ui.gyro.visualVal %= 360;
    if (ui.gyro.visualVal < 0) {
        ui.gyro.visualVal += 360;
    }
    ui.gyro.arm.style.transform = `rotate(${ui.gyro.visualVal}deg)`;
    ui.gyro.number.innerHTML = ui.gyro.visualVal + 'º';
};
NetworkTables.addKeyListener('/SmartDashboard/drive/navx/yaw', updateGyro);

// The following case is an example, for a robot with an arm at the front.
NetworkTables.addKeyListener('/SmartDashboard/robot/elevator/encoder', (key, value) => {
    // 0 is all the way back, 1200 is 45 degrees forward. We don't want it going past that.
    if (value > 100) {
        value = 100;
    }
    else if (value < -46500) {
        value = -46500;
    }
    // Calculate visual rotation of arm
    var armAngle = value / 160;
    // Rotate the arm in diagram to match real arm
    ui.robotDiagram.arm.style.transform = `translateY(${armAngle}px)`; // `rotate(${armAngle}deg)`;
    ui.armText.textContent = 'Elevator Height: ' + Math.round(value / -1159) + ' inches\n' + (value * -1)
});

// This button is just an example of triggering an event on the robot by clicking a button.
NetworkTables.addKeyListener('/SmartDashboard/example_variable', (key, value) => {
    // Set class active if value is true and unset it if it is false
    ui.example.button.classList.toggle('active', value);
    ui.example.readout.data = 'Value is ' + value;
});

NetworkTables.addKeyListener('/SmartDashboard/robot/time', (key, value) => {
    // This is an example of how a dashboard could display the remaining time in a match.
    // We assume here that value is an integer representing the number of seconds left.
    ui.timer.innerHTML = value < 0 ? '0:00' : Math.floor(value / 60) + ':' + (value % 60 < 10 ? '0' : '') + value % 60;
});

// Load list of prewritten autonomous modes
NetworkTables.addKeyListener('/SmartDashboard/Auto List', (key, value) => {
    // Clear previous list
    while (ui.autoSelect.firstChild) {
        ui.autoSelect.removeChild(ui.autoSelect.firstChild);
    }
    // Make an option for each autonomous mode and put it in the selector
    for (let i = 0; i < value.length; i++) {
        var option = document.createElement('option');
        option.appendChild(document.createTextNode(value[i]));
        ui.autoSelect.appendChild(option);
    }
    // Set value to the already-selected mode. If there is none, nothing will happen.
    ui.autoSelect.value = NetworkTables.getValue('/SmartDashboard/Autonomous Mode/selected');
});

// Load list of prewritten autonomous modes
NetworkTables.addKeyListener('/SmartDashboard/Autonomous Mode/selected', (key, value) => {
    ui.autoSelect.value = value;
});

NetworkTables.addKeyListener('/SmartDashboard/robot/totalCurrent', (key, value) => {
    ui.robotCurrent.textContent = 'Current: ' + value + 'A';
});

NetworkTables.addKeyListener('/SmartDashboard/robot/totalEnergy', (key, value) => {
    ui.robotEnergy.textContent = 'Energy: ' + value + 'J';
});

NetworkTables.addKeyListener('/SmartDashboard/robot/totalPower', (key, value) => {
    ui.robotPower.textContent = 'Power: ' + value + 'W';
});

ui.camera.onclick = function() {
    var d = new Date();
    ui.camera.setAttribute("style","background-image: url(http://10.60.98.2:1181/?action=stream"+d.getTime()+")");
};

// The rest of the doc is listeners for UI elements being clicked on
ui.example.button.onclick = function() {
    // Set NetworkTables values to the opposite of whether button has active class.
    NetworkTables.putValue('/SmartDashboard/example_variable', this.className != 'active');
};
// Reset gyro value to 0 on click
ui.gyro.container.onclick = function() {
    // Store previous gyro val, will now be subtracted from val for callibration
    ui.gyro.offset = ui.gyro.val;
    // Trigger the gyro to recalculate value.
    updateGyro('/SmartDashboard/drive/navx/yaw', ui.gyro.val);
};
// Update NetworkTables when autonomous selector is changed
ui.autoSelect.onchange = function() {
    NetworkTables.putValue('/SmartDashboard/Autonomous Mode/selected', this.value);
};
// Get value of arm height slider when it's adjusted
ui.armPosition.oninput = function() {
    NetworkTables.putValue('/SmartDashboard/robot/elevator/encoder', parseInt(this.value));
};

addEventListener('error',(ev)=>{
    ipc.send('windowError',{mesg:ev.message,file:ev.filename,lineNumber:ev.lineno})
})