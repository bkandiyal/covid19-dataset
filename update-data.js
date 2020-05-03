const fs = require('fs')
const axios = require('axios')
const cheerio = require('cheerio')
const zb = require('zebras')

axios.all([
    axios.get('https://github.com/CSSEGISandData/COVID-19/raw/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv'),
    axios.get('https://github.com/CSSEGISandData/COVID-19/raw/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_recovered_global.csv'),
    axios.get('https://github.com/CSSEGISandData/COVID-19/raw/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv'),
    axios.get('https://www.mohfw.gov.in/')
]).then(axios.spread((c, r, d, moh) => {
    fs.writeFileSync('data/time_series_covid19_confirmed_global.csv', c.data);
    fs.writeFileSync('data/time_series_covid19_recovered_global.csv', r.data);
    fs.writeFileSync('data/time_series_covid19_deaths_global.csv', d.data);

    india_c = zb.readCSV('data/time_series_covid19_confirmed_India.csv')
    india_r = zb.readCSV('data/time_series_covid19_recovered_India.csv')
    india_d = zb.readCSV('data/time_series_covid19_deaths_India.csv')

    var $ = cheerio.load(moh.data);
    let date = new Date($('#site-dashboard .status-update span').text().split(':').slice(1)[0].trim().split(',')[0]);
    let t = (date.getMonth()+1)+'/'+(date.getDate())+'/'+date.getFullYear();
    console.log('Date: ' + t);

    $('#state-data .data-table table tbody').find('tr').each(function(i, e) {
        let children = $(e).children();
        if (isNaN(parseInt($(children[0]).text()))) return;
        let state = $(children[1]).text().replace(/[^A-Za-z0-9 ]/g, '')
        let confirmed = parseInt($(children[2]).text().replace(/[^A-Za-z0-9 ]/g, ''))
        let recovered = parseInt($(children[3]).text().replace(/[^A-Za-z0-9 ]/g, ''))
        let deaths = parseInt($(children[4]).text().replace(/[^A-Za-z0-9 ]/g, ''))
        console.log(state + ' - ' + confirmed)
        india_c = putData(india_c, state, t, confirmed)
        india_r = putData(india_c, state, t, recovered)
        india_d = putData(india_c, state, t, deaths)
    });

    zb.toCSV(india_c, 'data/time_series_covid19_confirmed_India.csv')
    zb.toCSV(india_r, 'data/time_series_covid19_recovered_India.csv')
    zb.toCSV(india_d, 'data/time_series_covid19_deaths_India.csv')
}));

function putData(df, state, date, value) {
    if(zb.filter(x => x['State/Province'] === state).length === 0) {
        let t = {
            'State/Province': state,
            'Country/Region': 'India',
            'Lat': '',
            'Long': '',
            date: value
        }
        df.push(t)
    } else {
        for (let i in df) {
            if (df[i]['State/Province'] === state) {
                df[i][date] = value
            }
        }
    }
    return df
}