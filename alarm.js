
//Note: The variables 'hr', 'min' and 'clockRadius' as used in this particular script are global variables from the other script, 'clock.js'.

this.addEventListener("DOMContentLoaded", initializeAlarm);

function initializeAlarm()
{
  window.name = 'js_clock';
  
  
  //Alarm script section ----->
  const fabButton = ID("show-alarm-UI-fab-button"),
        darkBgOverlay = ID("alarm-dark-bg-overlay"),
        alarmContainer = ID("alarm-container"),
        addAlarmContainer = ID("add-alarm-container"),
        alarmsListContainer = ID("alarms-list-container"), 
        activeAlarmContainer = ID("show-active-alarm-container"),
        addAlarmButton = ID("add-alarm-button"),
        showAlarmsListButton = ID("alarms-list-button"),
        showAlarmUIButton = ID("show-add-alarm-button"), 
        snoozeActiveAlarmButton = ID("snooze-active-alarm-button"),
        dismissActiveAlarmButton = ID("dismiss-active-alarm-button"),
        chooseAlarmToneIcon = ID("choose-alarm-tone-icon"),
        selectAlarmTone = ID("select-alarm-tone");
      
  let storageIsEnabled = navigator.cookieEnabled,
      alarmTitle = ID("alarm-title"),
      alarmHr = ID("alarm-hr"),
      alarmMin = ID("alarm-min"),
      alarmAmPm = ID("alarm-am-pm"),
      snoozeSelectOption = ID("snooze-alarm"),
      addAlarmUIIsActive = false,
      alarmsListUIIsActive = false,
      activeAlarmUIIsActive = false,
      setAlarms = [];
  
  

  let windowJustLoaded = true;
  //using 'mouseover' event handler to kinda prevent the 'user interaction gesture error' on Chrome on autoplay/play of alarm tone/audio when page just loads
  window.onclick = () => windowJustLoaded = false;


  //resize alarm container on screen/window resize
  window.onresize = resizeAlarmContainer;
  


  //Programmatically adding alarm <select> <option>'s mark-up
  let alarmTones =
  {
    "Amazing": "amazing",
    "Buzzer": "buzzer", 
    "Gypsy": "gypsy",
    "Kalimba": "kalimba", 
    "Lovely": "lovely", 
    "Maid with the Flaxen Hair": "maid_with_the_flaxen_hair",
    "Sleep Away": "sleep_away"
  };
  for (let name in alarmTones)
    selectAlarmTone.insertAdjacentHTML("beforeend", `<option value="tones/${alarmTones[name]}.mp3">${name}</option>`);

  for (let i = 1, j; i < 13; i++)
    j = i < 10 ? "0" + i : i,
    alarmHr.insertAdjacentHTML("beforeend", `<option class="input" value="${j}">${j}</option>"`);

  for (let i = 0, j; i < 60; i++)
    j = i < 10 ? "0" + i : i,
    alarmMin.insertAdjacentHTML("beforeend", `<option class="input" value="${j}">${j}</option>`);

  for (let i = 2; i <= 30; i++)
    if (i == 2 || i == 5 || i == 10 || i == 15 || i == 30)
      snoozeSelectOption.insertAdjacentHTML("beforeend", `<option class="input" value="${i}">&#8634; ${i} minutes</option>`);
  

      
  //checking if any alarms exist in storage and loading them
  if (storageIsEnabled)
    for (let id in localStorage)
      if (id.match(/\d+:\d+(AM|PM)/))
        setAlarms.push(JSON.parse(localStorage[id]));
        // delete localStorage[id];
  

  
  //sorting set Alarms in alarms list
  if (setAlarms[1])
    setAlarms.sort((a, b) => 
    {
      if (/Alarm \d+/.test(a.title) && /Alarm \d+/.test(b.title))
        return Number(a.title.replace(/[^\d]/g, "")) - Number(b.title.replace(/[^\d]/g, ""));
      else if (/Alarm \d+/.test(b.title))
        return Number(b.title.replace(/[^\d]/g, ""));
      else if (/Alarm \d+/.test(a.title))
        return Number(a.title.replace(/[^\d]/g, ""));
      else
        return parseInt(a.time) - parseInt(b.time);
    });
    


  //readying set Alarms properties and methods (functions)
  for (let alarm of setAlarms)
  {
    for (let prop in alarm)
      if (prop == "add")
        alarm[prop] = () => addAlarmFunc(alarm);
      else if (prop == "alarmIntervalFunction")
        alarm[prop] = (snoozeCalled) => alarmIntervalFunc(alarm, snoozeCalled),
        alarm.alarmInterval = setInterval(alarm[prop], 4000);
      else if (prop == "remove")
        alarm[prop] = (delButton) => removeAlarmFunc(alarm, delButton);
      else if (prop == "snooze")
        alarm[prop] = () => snoozeAlarmFunc(alarm);
      else if (prop == "dismiss")
        alarm[prop] = () => dismissAlarmFunc(alarm);
      else if (prop == "isSnoozed")
        alarm[prop] = JSON.parse(alarm[prop]);
      else if (Number(alarm[prop]) && (prop != "hr" && prop != "min")) //prevent 'hr' and 'min' props from being converted to Numbers to preserve leading zeroes if there be any
        alarm[prop] = Number(alarm[prop]);
    appendAlarmToAlarmsList(alarm, alarm.id, alarm.title, alarm.hr, alarm.min, alarm.am_pm);
  }
  

  
  //appends set Alarm to Alarms List
  function appendAlarmToAlarmsList(currentAlarm, id, title, hr, min, am_pm)
  {
    let alarm = currentAlarm;
    let alarmListItem = `
      <div class="alarm-list-item js--alarm-list-item">
        <div class="alarm-list-item-wrapper">
          <span class="alarm-list-id js--alarm-list-id">${id}</span>
          <i class="alarm-list-title js--alarm-list-title">${title}</i>
          <b class="alarm-list-time js--alarm-list-time">${hr}:${min}${am_pm}</b>
          <button class="alarm-delete-button js--alarm-delete-button">&times; Remove</button>
        </div>
      </div>`;
    ID("alarms-list-wrapper").insertAdjacentHTML("beforeend", alarmListItem);
    query(".js--alarm-list-item").style.borderTop = "none";

    //adding delete/remove action event listener for each added/set alarm
    let numOfItems = queryAll(".js--alarm-list-item").length;
    queryAll(".js--alarm-delete-button")[numOfItems - 1].addEventListener("click", function() 
    {
      let delButton = this;
      delButton.parentNode.parentNode.style.opacity = "0";
      ID("alarms-list-wrapper").style.overflow = "hidden";
      setTimeout(() =>
      {
        delButton.parentNode.parentNode.style.height = "0";
        alarm.remove(delButton);
        //to avoid display of alarms-list-wrapper side scroll bar on list-item deletion transition (animation)
        setTimeout(() => ID("alarms-list-wrapper").style.overflow = "auto", 1000);
        delete localStorage[id];
        ID(`${alarm.id}`).classList.remove("scale-dot");
        setTimeout(() => ID(`${alarm.id}`).parentNode.removeChild(ID(`${alarm.id}`)), 300);
      }, 550);
      clearInterval(alarm.alarmInterval);
    });

    //adding alarm red dot description to clock
    ID("clock-wrapper").insertAdjacentHTML("beforeend", `
        <i class="set-alarm-dot-wrapper" id="${alarm.id}">
          <i class="set-alarm-dot">
            <i class="alarm-dot-time js--alarm-dot-time">${alarm.id}</i>
          </i>
        </i>`);
    let _top = (Math.cos(((30 * alarm.hr) + Number((30 * (alarm.min / 60)).toFixed(2))) * Math.PI / 180) * (clockRadius + 18)).toFixed(6);
    let right = (Math.sin(((30 * alarm.hr) + Number((30 * (alarm.min / 60)).toFixed(2))) * Math.PI / 180) * (clockRadius + 18)).toFixed(6);
    ID(`${alarm.id}`).style.top = `${(((clockRadius - 5)) - _top)}px`;
    ID(`${alarm.id}`).style.right = `${(((clockRadius - 5.5)) - right)}px`;
    setTimeout(() => ID(`${alarm.id}`).classList.add("scale-dot"), 300);
  }
  

  
  //shows alarm on click of fab icon button
  let show_hide = undefined;
  fabButton.onclick = function()
  {
    //clears function timeout incase user dblclicks before function is completed 
    
    //using a setTimeout function to control show/hide misbehaviour on dblclick of fab button
    show_hide = setTimeout(() =>
    {
      if (addAlarmUIIsActive || alarmsListUIIsActive || activeAlarmUIIsActive)
      {
        if (activeAlarmUIIsActive)
          dismissActiveAlarmButton.onclick(); 
        else
          hideAlarmContainer(),
          ID("choose-alarm-tone-button").classList.remove("scale-dot");
      }
      else
        rotateFabIfIconIsCross(false),
        showAlarmContainer(),
        ID("choose-alarm-tone-button").classList.add("scale-dot");
    }, 100);
    //reset margin-left of alarm list items to enable transition
    for (let i = 0; i < queryAll(".alarm-list-item").length; i++)
      setTimeout(() => queryAll(".alarm-list-item")[i].style.marginLeft = "120%", 100);
  }
  
  
  
  darkBgOverlay.onclick = function(e)
  {
    if (e.target == this && (addAlarmUIIsActive || alarmsListUIIsActive))
      fabButton.onclick();
  };




  //switches and adds the rotate class name on click of fab icon button
  function rotateFabIfIconIsCross(fabIsRotated)
  {
    if (fabIsRotated)
      ID("fab-plus-vertical").classList.remove("rotateLeft"),
      ID("fab-plus-horizontal").classList.remove("rotateLeft"),
      setTimeout(() => ID("fab-descriptor").innerHTML = "Add an Alarm", 500);
    else
      ID("fab-plus-vertical").classList.add("rotateLeft"),
      ID("fab-plus-horizontal").classList.add("rotateLeft"),
      setTimeout(() => ID("fab-descriptor").innerHTML = "Close Alarm UI", 500);
    if (activeAlarmUIIsActive)
      setTimeout(() => ID("fab-descriptor").innerHTML = "Dismiss Alarm", 500);
  }



  //resizes alarm on switch of UI's
  function resizeAlarmContainer() 
  {
    alarmContainer.style.borderRadius = "5px";
    ID("alarms-list-wrapper").style.maxHeight = `${window.innerHeight - 150}px`;
    alarmsListContainer.style.maxHeight = `${window.innerHeight - 20}px`;
    
    if (addAlarmUIIsActive)
      resizeTo(addAlarmContainer);
    else if (alarmsListUIIsActive)
      resizeTo(alarmsListContainer);
    else if (activeAlarmUIIsActive)
      resizeTo(activeAlarmContainer);
    else
      resizeTo(null);

    function resizeTo(container)
    {
      alarmContainer.style.borderRadius = container ? "5px" : "300px";
      setTimeout(() => alarmContainer.style.height = container ? `${container.offsetHeight}px` : "0", 200);
    }
  };
  resizeAlarmContainer();



  //hides alarm container
  function hideAlarmContainer()
  {
    // if (!addAlarmUIIsActive && !alarmsListUIIsActive && !activeAlarmUIIsActive)
    //   return;

    ID("alarm-tone").pause();
    alarmContainer.classList.remove("scale")
    //this loop fades out all alarm sub-containers
    for (let i = 0; i < 3; i++)
      queryAll(".js--containers")[i].style.opacity = 0;
    resizeAlarmContainer();
    
    setTimeout(() =>
    {
      alarmContainer.style.borderRadius = "300px";
      //loop hides all alarm sub-containers
      for (let i = 0; i < 3; i++)
        queryAll(".js--containers")[i].style.display = "none";
      setTimeout(() => 
      {
        addAlarmUIIsActive = false;
        alarmsListUIIsActive = false;
        activeAlarmUIIsActive = false;
        ID("alarm-tone").load();
        darkBgOverlay.style.background = "rgba(0, 0, 0, 0)";
        setTimeout(() => darkBgOverlay.style.display = "none", 300);
      }, 350);
    }, 150);
    rotateFabIfIconIsCross(true);
  }

  

  //shows alarm / alarm container
  function showAlarmContainer(container, containerIndex)
  {
    // if (addAlarmUIIsActive || alarmsListUIIsActive || activeAlarmUIIsActive)
    //   return;

    if (containerIndex != 3)
      alarmContainer.classList.remove("scale");
    container = container && isNaN(container) ? container : addAlarmContainer;
    containerIndex = containerIndex ? containerIndex : 1;
    darkBgOverlay.style.display = "flex";
    container.style.display = "block";
    setTimeout(() =>
    {
      addAlarmUIIsActive = containerIndex == 1 ? true : false;
      alarmsListUIIsActive = containerIndex == 2 ? true : false;
      activeAlarmUIIsActive = containerIndex == 3 ? true : false;
      darkBgOverlay.style.background = "rgba(0, 0, 0, 0.5)";
      resizeAlarmContainer();
      if (activeAlarmUIIsActive)
        alarmContainer.classList.add("scale"),
        ID("alarm-tone").play();
      setTimeout(() => container.style.opacity = 1, 350);
    }, 10);
    rotateFabIfIconIsCross(false);
  }



  //hide snooze button function if alarm is not snoozed else show
  function hideOrShowSnoozeButton(isSnoozed)
  {
    if (isSnoozed)
      ID("snooze-active-alarm-button").style.display = "initial",
      ID("dismiss-active-alarm-button").style.borderRadius = "0 3px 3px 0",
      ID("dismiss-active-alarm-button").style.width = "50%";
    else
      ID("snooze-active-alarm-button").style.display = "none",
      ID("dismiss-active-alarm-button").style.borderRadius = "3px",
      ID("dismiss-active-alarm-button").style.width = "100%";
  }
  
  

  //shows alarms list UI ----->
  showAlarmsListButton.onclick = function()
  {
    addAlarmUIIsActive = false;
    alarmsListUIIsActive = true;
    activeAlarmUIIsActive = false;
    addAlarmContainer.style.opacity = 0;
    setTimeout(() => 
    {
      addAlarmContainer.style.display = "none";
      alarmsListContainer.style.display = "block";
      setTimeout(() => {
        resizeAlarmContainer();
        setTimeout(() => alarmsListContainer.style.opacity = 1, 350);
      }, 50);
    }, 150);
    //sets height of each alarm list item to enable height transition animation on deletion of alarm
    let numOfItems = queryAll(".alarm-list-item").length;
    setTimeout(() =>
    {
      for (let i = 0; i < numOfItems; i++)
        queryAll(".alarm-list-item")[i].style.height = `${queryAll(".alarm-list-item")[i].offsetHeight}px`;
      for (let i = 0, timeout = 300; i < numOfItems; i++, timeout += 100)
        setTimeout(() => {
          queryAll(".alarm-list-item")[i].style.marginLeft = "0";
          queryAll(".alarm-list-item")[i].style.opacity = "1";
        }, timeout);
    }, 200);
  }



  //re-shows alarm UI ----->
  showAlarmUIButton.onclick = function()
  {
    addAlarmUIIsActive = true;
    alarmsListUIIsActive = false;
    activeAlarmUIIsActive = false;
    alarmsListContainer.style.opacity = 0;
    setTimeout(() =>
    {
      alarmsListContainer.style.display = "none";
      addAlarmContainer.style.display = "block";
      setTimeout(() =>
      {
        resizeAlarmContainer();
        setTimeout(() => 
        { 
          addAlarmContainer.style.opacity = 1; 
          for (let i = 0; i < queryAll(".alarm-list-item").length; i++)
            queryAll(".alarm-list-item")[i].style.marginLeft = "120%",
            queryAll(".alarm-list-item")[i].style.opacity = "0";
        }, 250);
      }, 50);
    }, 150);
  }



  snoozeActiveAlarmButton.onclick = () =>
  {
    let currentActiveAlarmID = ID("show-active-alarm-id").innerHTML;
    if (setAlarms[0])
      for (let alarm of setAlarms)
        if (alarm.id == currentActiveAlarmID)
        {
          alarm.snooze();
          break;
        }
  }



  dismissActiveAlarmButton.onclick = () =>
  {
    let currentActiveAlarmID = ID("show-active-alarm-id").innerHTML;
    if (setAlarms[0])
      for (let alarm of setAlarms)
        if (alarm.id == currentActiveAlarmID)
        {
          alarm.dismiss();
          break;
        }
  }



  //changes and loads new tone for next set alarm
  selectAlarmTone.onchange = function()
  {
    ID("alarm-tone-source").src = this.value;
    ID("alarm-tone").load();
  } 



  //hides or shows 'select alarm tone' button
  let selectToneIsActive = false;
  chooseAlarmToneIcon.onclick = () =>
  {
    if (!selectToneIsActive)
      chooseAlarmToneIcon.onmouseout(),
      setTimeout(() => ID("select-alarm-tone").classList.add("show"), 250),
      selectToneIsActive = true;
    else
      ID("select-alarm-tone").classList.remove("show"),
      setTimeout(() => chooseAlarmToneIcon.onmouseover(), 300),
      selectToneIsActive = false;
  }

  //shows alarm-tone-button-descriptor on the button's mouseover
  chooseAlarmToneIcon.onmouseover = () => 
  { 
    if (!selectToneIsActive) 
      ID("alarm-tone-button-descriptor").classList.add("show");
  }

  //hides alarm-tone-button-descriptor on the button's mouseover
  chooseAlarmToneIcon.onmouseout = () => ID("alarm-tone-button-descriptor").classList.remove("show");
  


  //add an alarm ----->
  addAlarmButton.onclick = () =>
  {
    let alarmIndex = setAlarms.length + 1;
    let titleInt;
    let indexExists = false;
    for (let alarm of setAlarms)
      if (alarmIndex == Number(alarm.title.replace(/[^\d]/g, "")))
        indexExists = true;
    if (indexExists)
      for (let alarm of setAlarms)
      {
        titleInt = Number(alarm.title.replace(/[^\d]/g, ""));
        if (/Alarm \d+/.test(alarm.title))
          if (titleInt >= alarmIndex)
            alarmIndex = titleInt + 1;
      }       
    let title = alarmTitle.value.trim() == "" ? `Alarm ${alarmIndex}` : alarmTitle.value.trim();
    let hour = alarmHr.value;
    let minute = alarmMin.value;
    let am_pm = alarmAmPm.value;
    let isSnoozed = snoozeSelectOption.value == "" ? false : true;
    let snoozeTime = (Number(snoozeSelectOption.value) * 60 * 1000);
    let alarmTone = selectAlarmTone.value;
    let alarmExists = false;

    for (let alarm of setAlarms)
      if (alarm.time == `${hour}:${minute}${am_pm}`)
      {
        alarmExists = true;
        break;
      }
      
    if (!alarmExists)
      new Alarm(title, hour, minute, am_pm, isSnoozed, snoozeTime, alarmTone).add(),
      setTimeout(() => alarmTitle.value = "", 600),
      alarmIndex++;
    else
      toast(`${hour}:${minute}${am_pm} alarm already set.`);
  }



  //adds alarm on press of the 'Enter' key when alarm title is focused
  alarmTitle.onkeyup = (e) =>
  {
    if (e.which == 13 || e.keyCode == 13)
      addAlarmButton.onclick();
  }

  

  //add Alarm function: used inside the add() method in the 'Alarm' class far below
  function addAlarmFunc(currentAlarm)
  {
    let alarm = currentAlarm;
    //alarm.alarmActual24Hr = hr > 12 ? Number(alarm.hr) + 12 : (hr == 0 ? alarm.hr;
    if (alarm.am_pm == "PM")
      alarm.alarmActual24Hr = Number(alarm.hr) < 12 ? Number(alarm.hr) + 12 : Number(alarm.hr);
    else
      alarm.alarmActual24Hr = Number(alarm.hr) == 12 ? 0 : Number(alarm.hr);
    alarm.id = alarm.time; //using alarm time as id instead of indexes
    alarm.alarmIntervalFunction = (snoozeCalled) => alarmIntervalFunc(alarm, snoozeCalled);

    //checks if set alarm is equal to current time and then delays alarmIntervalFunction execution
    if (alarm.alarmActual24Hr == hr && alarm.min == min && alarm.am_pm == ID("am-pm").innerHTML)
      alarm.alarmInterval = setTimeout(() => setInterval(alarm.alarmIntervalFunction, 4000), 60000);
    else
      alarm.alarmInterval = setInterval(alarm.alarmIntervalFunction, 4000);
    
    //calculates the number of hours and minutes till alarm goes off and displays to user in toast
    showAlarmGoOffTime.bind(alarm)();

    function showAlarmGoOffTime()
    {
      let alarmHr, alarmMin, clockHr, clockMin, clockFullTimeInMins, alarmFullTimeInMins,
          goOffMin, overflowMin, goOffHr, hrGrammar, minGrammar, addOneExtraHr;

      alarmHr = alarm.alarmActual24Hr;
      alarmMin = Number(alarm.min);
      clockHr = hr;
      clockMin = min;
      clockFullTimeInMins = (clockHr * 60) + clockMin;
      alarmFullTimeInMins = (alarmHr * 60) + alarmMin;
      goOffMin = (60 + (alarmMin - clockMin));
      overflowMin = goOffMin > 60 ? goOffMin - 60 : 0;
      addOneExtraHr = goOffMin == 60 ? 1 : 0;
      goOffMin = goOffMin > 60 ? overflowMin : goOffMin;

      if (alarmFullTimeInMins > clockFullTimeInMins)
        goOffHr = Math.floor((alarmFullTimeInMins - clockFullTimeInMins) / 60),
        goOffHr = overflowMin == 0 ? goOffHr : goOffHr + addOneExtraHr;
      else
        goOffHr = 23 - Math.floor((clockFullTimeInMins - alarmFullTimeInMins) / 60),
        goOffHr = overflowMin == 0 ? goOffHr : goOffHr + addOneExtraHr;
      goOffHr = alarmFullTimeInMins == clockFullTimeInMins ? 24 : goOffHr;
      
      hrGrammar = goOffHr > 1 ? "hours" : "hour";
      minGrammar = goOffMin > 1 ? "minutes" : "minute";
      if (goOffHr < 1)
        return toast(`${alarm.hr}:${alarm.min}${alarm.am_pm} alarm added. <br />Alarm will go off in ${goOffMin} ${minGrammar}.`);
      else if (goOffHr > 0 && goOffMin < 60)
        return toast(`${alarm.hr}:${alarm.min}${alarm.am_pm} alarm added. <br />Alarm will go off in ${goOffHr} ${hrGrammar} and ${goOffMin} ${minGrammar}.`);
      else
        return toast(`${alarm.hr}:${alarm.min}${alarm.am_pm} alarm added. <br />Alarm will go off in ${goOffHr} ${hrGrammar}.`);
    }

    appendAlarmToAlarmsList(alarm, alarm.id, alarm.title, alarm.hr, alarm.min, alarm.am_pm);

    //store active alarm in an array
    setAlarms.push(alarm);

    let alarmManifest = 
    {
      "id": alarm.id,
      "title": alarm.title,
      "hr": alarm.hr,
      "min": alarm.min,
      "am_pm": alarm.am_pm,
      "isSnoozed": alarm.isSnoozed,
      "snoozeTime": alarm.snoozeTime,
      "alarmTone": alarm.alarmTone,
      "alarmInterval": alarm.alarmInterval,
      "alarmIntervalFunction": "",
      "alarmActual24Hr": alarm.alarmActual24Hr,
      "add": "for addFunction: JSON doesn't accept functions as values.",
      "remove": "for removeFunction",
      "snooze": "for snoozeFunction",
      "dismiss": "for dismissFunction",
      "time": alarm.time
    }
    
    //store/save 'manifest' of set alarm in localStorage
    if (storageIsEnabled)
      localStorage.setItem(alarm.id, JSON.stringify(alarmManifest));
    else
      setTimeout(() => toast(`Something went wrong. <br /> ${alarm.time} alarm was added but wasn't saved. <br />Ensure your browser cookies are enabled.`), 4000)
  }



  //alarmIntervalFunction used inside the addAlarmFunction above
  function alarmIntervalFunc(alarm, snoozeCalled)
  {
    //this is done in an attempt to prevent the autoplay error on Chrome
    if (windowJustLoaded)
      return;

    //stop function execution in case an alarm is already active to avoid clash of display in alarms
    if (activeAlarmUIIsActive && alarm.id != ID("show-active-alarm-id").innerHTML)
      return;

    if (!snoozeCalled && (alarm.alarmActual24Hr == hr && alarm.min == min && alarm.am_pm == ID("am-pm").innerHTML))
      activateAlarm();
    else if (snoozeCalled)
    {
      let hour, minute, currentTime;
      minute = min < 10 ? `0${min}` : min;
      if (hr < 12)
        hour = hr < 10 ? (hr == 0 ? "12" : `0${hr}`) : hr,
        currentTime = `${hour}:${minute}AM`;
      else
        hour = hr > 11 ? (hr == 12 ? 12 : `${hr - 12}`) : hr,
        currentTime = `${hour}:${minute}PM`;
      activateAlarm();
      ID("show-active-alarm-time").innerHTML = `<b class="unbolden">⏰</b> ${currentTime}`;
    }
    
    function activateAlarm()
    {
      window.open('', 'js_clock').focus();
      
      if (alarm.isSnoozed)
        hideOrShowSnoozeButton(true);
      else
        hideOrShowSnoozeButton(false);
      ID("show-active-alarm-id").innerHTML = alarm.id;
      ID("show-active-alarm-title").innerHTML = alarm.title;
      ID("show-active-alarm-time").innerHTML = `<b class="unbolden">⏰</b> ${alarm.hr}:${alarm.min}${alarm.am_pm}`;
      rotateFabIfIconIsCross(false);

      if (addAlarmUIIsActive || alarmsListUIIsActive)
        fabButton.onclick();
      if (!activeAlarmUIIsActive)
      {
        ID("alarm-tone-source").src = alarm.alarmTone;
        ID("alarm-tone").load();
        setTimeout(() => {
          showAlarmContainer(activeAlarmContainer, 3);
          for (let tone in alarmTones)
            if (alarmTones[tone] == alarm.alarmTone.replace(/tones\/(.+)\.mp3/, "$1")) 
              toast(`Alarm tone: "${tone}"`);
        }, 1000);
      }
    
      let snoozeTime, snoozeGrammar;
      if (alarm.isSnoozed)
        snoozeTime = (alarm.snoozeTime / 60) / 1000,
        snoozeGrammar = snoozeTime == 1 ? "min" : "mins",
        snoozeActiveAlarmButton.innerHTML = `&#8634; Snooze (${snoozeTime} ${snoozeGrammar})`;
    }
  }


  
  //removeAlarmFunction: used inside the Alarm class
  function removeAlarmFunc(currentAlarm, delButton)
  {
    let alarm = currentAlarm;
    setTimeout(() =>
    {
      resizeAlarmContainer();
      toast(`${alarm.hr}:${alarm.min}${alarm.am_pm} alarm removed.`);
      setTimeout(() => 
      {
        query(".js--alarm-list-item").style.borderTop = "none";
        delButton.parentNode.parentNode.parentNode.removeChild(delButton.parentNode.parentNode);          
        let i = 0;
        for (let alarm of setAlarms)
        {
          if (alarm.id == delButton.parentNode.querySelector(".js--alarm-list-id").innerHTML)
            setAlarms.splice(i, 1); //removing active alarm from setAlarms array
          i++;
        }
          
      }, 500);
    }, 200);
  }



  //snoozeAlarmFunction: used inside the Alarm class
  function snoozeAlarmFunc(currentAlarm)
  {
    let alarm = currentAlarm;
    clearInterval(alarm.alarmInterval);
    hideAlarmContainer();
    alarm.alarmInterval = setInterval(() => {
      alarm.alarmIntervalFunction(true);
    }, alarm.snoozeTime + 1000);
  }



  //dismissAlarmFunction: used inside the Alarm class
  function dismissAlarmFunc(currentAlarm)
  {
    let alarm = currentAlarm;
    clearInterval(alarm.alarmInterval);
    let awaitTimeout = (61 - sec) * 1000;
    hideAlarmContainer();
    setTimeout(() => alarm.alarmInterval = setInterval(alarm.alarmIntervalFunction, 1000), awaitTimeout);
  }



  //alarm class (add / remove ... alarm)
  class Alarm 
  {
    constructor (title, hour, minute, am_pm, isSnoozed, snoozeTime, alarmTone) 
    { 
      this.id = undefined;
      this.title = title;
      this.hr = hour;
      this.min = minute;
      this.am_pm = am_pm;
      this.isSnoozed = isSnoozed;
      this.snoozeTime = snoozeTime;
      this.alarmTone = alarmTone;
      this.alarmActual24Hr = undefined;
      this.alarmInterval = undefined;
      this.alarmIntervalFunction = undefined;
    }
    
    add()
    {
      addAlarmFunc(this);
    }

    remove(delButton)
    {
      removeAlarmFunc(this, delButton);
    }
    
    snooze()
    {
      snoozeAlarmFunc(this);
    }

    dismiss()
    {
      dismissAlarmFunc(this);
    }

    get time() 
    { 
      return `${this.hr}:${this.min}${this.am_pm}`;
    }
  }

  //Say "Hello!" on page load
  setTimeout(() => toast("Hello, there! Welcome. :)"), 1500);
}



// The toast
let hideToastTimeout = "Code by Power'f GOD⚡⚡", fadeToastTimeout;
function toast(text)
{
  text = String(text);
  //clears toast fade out timeout to ensure smooth hide behaviour in case of a double/simultaneous action
  if (hideToastTimeout)
  {
    resetToastTransitionTiming(0.22);
    ID("toast-wrapper").style.opacity = "0";
    clearTimeout(hideToastTimeout);
    clearTimeout(fadeToastTimeout);
  }

  ID("toast-wrapper").style.display = "inline-block";
  setTimeout(() =>
  {
    ID("toast").innerHTML = text;
    ID("toast-wrapper").style.opacity = "1";
    fadeToastTimeout = setTimeout(() =>
    {
      resetToastTransitionTiming(0.85);
      ID("toast-wrapper").style.opacity = "0";
      hideToastTimeout = setTimeout(hideToast, 1100);
      function hideToast()
      {
        resetToastTransitionTiming(0.25);
        ID("toast-wrapper").style.display = "none"; 
      }
    }, 4000);
  }, 500);
  
  function resetToastTransitionTiming(dur)
  {
    ID("toast-wrapper").style.WebkitTransition = `opacity ${dur}s ease-out`;
    ID("toast-wrapper").style.MozTransition = `opacity ${dur}s ease-out`;
    ID("toast-wrapper").style.MsTransition = `opacity ${dur}s ease-out`;
    ID("toast-wrapper").style.OTransition = `opacity ${dur}s ease-out`;
    ID("toast-wrapper").style.transition = `opacity ${dur}s ease-out`;
  }
}
