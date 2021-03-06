var https = require('https');

exports.handler = function (event, context) {

  // noinspection JSAnnotator
    try {

    if (event.session.new) {
      // New Session
      console.log("NEW SESSION")
    }

    switch (event.request.type) {

      case "LaunchRequest":
        // Launch Request
        console.log('LAUNCH REQUEST');
        context.succeed(
          generateResponse(
            buildSpeechletResponse("Welcome to an Alexa Skill, this is running on a deployed lambda function", true), {}
          )
        );
        break;

      case "IntentRequest":
        // Intent Request
        console.log('INTENT REQUEST');

        switch (event.request.intent.name) {
            case "WeatherDateIntent":
              var jsonWeekDay = "";
              var today = new Date();
              var dd = today.getDate();
              var mm = today.getMonth() + 1; //January is 0!
              var yyyy = today.getFullYear();
              if (dd < 10) {
                dd = '0' + dd
              }
              if (mm < 10) {
                mm = '0' + mm
              }
              today = yyyy + '-' + mm + '-' + dd;
              var saidDate = event.request.intent.slots.Date.value;
              if (saidDate == null) {
                saidDate = today;
                console.log("SaidDate == null this is will be the current datevalue: " + saidDate)
              }
              var comingDay = false;
              console.log("Slot.Datum: " + saidDate);
              var endpoint = ""; //https://api.openweathermap.org/data/2.5/forecast?q=Zurich,ch&units=metric&mode=json&appid=<YOUR API-KEY>
              var body = "";
              https.get(endpoint, (response) => {
                response.on('data', (chunk) => {
                  body += chunk
                });
                response.on('end', () => {
                  var data = JSON.parse(body);
                  var listOfMaxMinWeatherToday = [];
                  var currentTemp = [];
                  for (var i = 0, len = data.list.length; i < len; i++) {
                    var jsonDate = new Date(data.list[i].dt * 1000);
                    var jsonYear = jsonDate.getFullYear();
                    var jsonMonth = jsonDate.getMonth() + 1;
                    var jsonDay = jsonDate.getDate();
                    if (jsonMonth < 10) {
                      jsonMonth = "0" + jsonMonth;
                    }
                    if (jsonDay < 10) {
                      jsonDay = "0" + jsonDate.getDate();
                    }

                    var jsonTime = jsonYear + "-" + jsonMonth + "-" + jsonDay;

                    console.log("JsonTime: " + jsonTime + " SaidDate: " + saidDate);
                    if (jsonTime === saidDate) {
                      var temp = data.list[i].main.temp;
                      var maxTemp = data.list[i].main.temp_max;
                      var minTemp = data.list[i].main.temp_min;
                      currentTemp.push(temp);
                      listOfMaxMinWeatherToday.push(maxTemp);
                      listOfMaxMinWeatherToday.push(minTemp);
                      console.log("currentTemp: "+temp+" maxTemp: "+maxTemp+" minTemp: "+minTemp);
                      if (today != jsonTime) {
                        comingDay = true;
                        var weekday = new Array(7);
                        weekday[0] = "Sunday";
                        weekday[1] = "Monday";
                        weekday[2] = "Tuesday";
                        weekday[3] = "Wednesday";
                        weekday[4] = "Thursday";
                        weekday[5] = "Friday";
                        weekday[6] = "Saturday";
                        jsonWeekDay = weekday[jsonDate.getDay()]
                      }
                    }
                  }
                  var minimum = Array.min(listOfMaxMinWeatherToday);
                  var maximum = Array.max(listOfMaxMinWeatherToday);
                  if (comingDay === true) {
                    context.succeed(
                      generateResponse(
                        buildSpeechletResponse(jsonWeekDay+' will be maximum '+Math.round(maximum)+' and minimum '+Math.round(minimum)+' degrees.', true), {}
                      )
                    )
                  }
                  context.succeed(
                    generateResponse(
                      buildSpeechletResponse('Currently it is '+Math.round(currentTemp[0])+' degrees. It will be maximum '+Math.round(maximum)+' and minimum '+Math.round(minimum)+' degrees.', true), {}
                    )
                  )
              })
            });
            break;

          default:
            throw "Invalid intent"
        }

        break;

      case "SessionEndedRequest":
        // Session Ended Request
        console.log('SESSION ENDED REQUEST');
        // noinspection JSAnnotator
      break;

      default:
        context.fail('INVALID REQUEST TYPE: '+event.request.type);

    }

  } catch (error) {
    context.fail('Exception: '+error);
  }

};

Array.min = function(array) {
  return Math.min.apply(Math, array)
};

Array.max = function(array) {
  return Math.max.apply(Math, array)
};

// Helpers
buildSpeechletResponse = function (outputText, shouldEndSession){

  return {
    outputSpeech: {
      type: "PlainText",
      text: outputText
    },
    shouldEndSession: shouldEndSession
  }

};

generateResponse = function (speechletResponse, sessionAttributes){
  return {
    version: "1.0",
    sessionAttributes: sessionAttributes,
    response: speechletResponse
  }

};