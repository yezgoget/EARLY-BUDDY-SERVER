const resUtil = require('../module/responseUtil');
const resMsg = require('../module/resMsg');
const statCode = require('../module/statusCode');
const pool = require('../module/pool');
var moment = require('moment');

module.exports = {
    addSchedule: async (scheduleName, scheduleStartTime, startAddress, startLongitude, startLatitude, endAddress, endLongitude, endLatitude) => {
        const addScheduleQuery = 'INSERT INTO schedules (scheduleName, scheduleStartTime, startAddress, startLongitude, startLatitude, endAddress, endLongitude, endLatitude) VALUES (?,?,?,?,?,?,?,?)';
        return await pool.queryParam_Arr(addScheduleQuery, [scheduleName, scheduleStartTime, startAddress, startLongitude, startLatitude, endAddress, endLongitude, endLatitude])
            .catch((err) => {
                console.log('addUsersSchedules err : ' + err);
            })
    },
    addPaths: async (pathType, totalTime, totalPay, totalWalkTime, transitCount) => {
        const addPathsQuery = 'INSERT INTO paths (pathType, totalTime, totalPay, totalWalkTime, transitCount) VALUES (?,?,?,?,?)';
        return await pool.queryParam_Arr(addPathsQuery, [pathType, totalTime, totalPay, totalWalkTime, transitCount])
            .catch((err) => {
                console.log('addPaths err : ' + err);

            })
    },
    addWalk: (trafficType, distance, sectionTime, pathIdx) => {
        const addWalkDetailQuery = 'INSERT INTO details (trafficType, distance, sectionTime) VALUES (?,?,?)'; //walk = 3 subway = 1, bus = 2
        const addPathsDetailsQuery = 'INSERT INTO pathsDetails (pathIdx, detailIdx) VALUES (?,?)';//RT
        return pool.Transaction(async (conn) => {
            let addWalkDetailResult = await conn.query(addWalkDetailQuery, [trafficType, distance, sectionTime]);
            let addWalkPathsDetailsResult = await conn.query(addPathsDetailsQuery, [pathIdx, addWalkDetailResult.insertId]);
            console.log('********************');
            console.log('걷기 추가 완료');
            console.log('********************');

        })
    },
    addBus: (trafficType, distance, sectionTime, stationCount, detailStartAddress, detailStartLongitude, detailStartLatitude, detailEndAddress, detailEndLongitude, detailEndLatitude, busNo, busType, stopArray, pathIdx) => {
        const addBusDetailQuery = 'INSERT INTO details (trafficType, distance, sectionTime, stationCount, detailStartAddress, detailStartLongitude, detailStartLatitude, detailEndAddress, detailEndLongitude, detailEndLatitude, busNo, busType) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)';
        const addBusDetailsStopsQuery = 'INSERT INTO detailsStops (detailIdx, stopIdx) VALUES (?,?)';//RT
        const addBusStopsQuery = 'INSERT INTO stops (stopName) VALUES (?)';
        const addPathsDetailsQuery = 'INSERT INTO pathsDetails (pathIdx, detailIdx) VALUES (?,?)';//RT
        const addSchedulesNoticesQuery = 'INSERT INTO schedulesNotices (scheduleIdx, arriveTime, noticeTime) VALUES (?,?,?)';
        return pool.Transaction(async (conn) => {
            let addBusDetailResult = await conn.query(addBusDetailQuery, [trafficType, distance, sectionTime, stationCount, detailStartAddress, detailStartLongitude, detailStartLatitude, detailEndAddress, detailEndLongitude, detailEndLatitude, busNo, busType]);
            for (var j = 0; j < stopArray.length; j++) {
                let addBusStopsResult = await conn.query(addBusStopsQuery, [stopArray[j].stationName]);
                let addBusDetailsStopsResult = await conn.query(addBusDetailsStopsQuery, [addBusDetailResult.insertId, addBusStopsResult.insertId]);
            }
            let addBusPathsDetailsResult = await conn.query(addPathsDetailsQuery, [pathIdx, addBusDetailResult.insertId]);
            console.log('********************');
            console.log('버스 추가 완료');
            console.log('********************');
        })
            .catch((err) => {
                console.log('addBus err : ' + err);
                return ({
                    code: statCode.BAD_REQUEST,
                    json: resUtil.successFalse(resMsg.NULL_VALUE)
                })
            })
    },
    addSubway: (trafficType, distance, sectionTime, stationCount, subwayLane, detailStartAddress, detailStartLongitude, detailStartLatitude, detailEndAddress, detailEndLongitude, detailEndLatitude, stopArray, pathIdx) => {
        const addSubwayDetailQuery = 'INSERT INTO details (trafficType, distance, sectionTime, stationCount, subwayLane, detailStartAddress, detailStartLongitude, detailStartLatitude, detailEndAddress, detailEndLongitude, detailEndLatitude) VALUES (?,?,?,?,?,?,?,?,?,?,?)';
        const addSubwayStopsQuery = 'INSERT INTO stops (stopName) VALUES (?)';
        const addSubwayDetailsStopsQuery = 'INSERT INTO detailsStops (detailIdx, stopIdx) VALUES (?,?)';//RT
        const addPathsDetailsQuery = 'INSERT INTO pathsDetails (pathIdx, detailIdx) VALUES (?,?)';//RT
        return pool.Transaction(async (conn) => {
            let addSubwayDetailResult = await conn.query(addSubwayDetailQuery, [trafficType, distance, sectionTime, stationCount, subwayLane, detailStartAddress, detailStartLongitude, detailStartLatitude, detailEndAddress, detailEndLongitude, detailEndLatitude]);
            for (var i = 0; i < stopArray.length; i++) {
                let addSubwayStopsResult = await conn.query(addSubwayStopsQuery, [stopArray[i].stationName]);
                let addSubwayDetailsStopsResult = await conn.query(addSubwayDetailsStopsQuery, [addSubwayDetailResult.insertId, addSubwayStopsResult.insertId]);
            }
            await conn.query(addPathsDetailsQuery, [pathIdx, addSubwayDetailResult.insertId]);
            console.log('********************');
            console.log(' 지하철 추가 완료');
            console.log('********************')
        })
    },
    addTime: async (arriveTime, noticeTime, scheduleIdx) => {
        const addSchedulesNoticesQuery = 'INSERT INTO schedulesNotices (scheduleIdx, arriveTime, noticeTime) VALUES (?,?,?)';
        return await pool.Transaction((conn) => {
            conn.query(addSchedulesNoticesQuery, [scheduleIdx, arriveTime, noticeTime]);
        })
    },
    addSchedulesNotices: async (scheduleIdx, arriveTime, noticeTime) => {
        const addSchedulesNoticesQuery = 'INSERT INTO schedulesNotices (scheduleIdx, arriveTime, noticeTime) VALUES (?,?,?)';
        return await pool.queryParam_Arr(addSchedulesNoticesQuery, [scheduleIdx, arriveTime, noticeTime])
            .catch((err) => {
                console.log('addSchedulesNotices err : ' + err);

            })
    },
    addUsersSchedules: async (userIdx, scheduleIdx) => { //RT
        const addUsersSchedulesQuery = 'INSERT INTO usersSchedules (userIdx, scheduleIdx) VALUES (?,?)';
        return await pool.queryParam_Arr(addUsersSchedulesQuery, [userIdx, scheduleIdx])
            .catch((err) => {
                console.log('addUsersSchedules err : ' + err);

            })
    },
    addSchedulesPaths: async (scheduleIdx, pathIdx) => {
        const addSchedulesPathsQuery = 'INSERT INTO schedulesPaths (scheduleIdx, pathIdx) VALUES (?,?)'; //RT
        return await pool.queryParam_Arr(addSchedulesPathsQuery, [scheduleIdx, pathIdx])
            .catch((err) => {
                console.log('addPaths err : ' + err);

            })
    },

    addWeekdays: async (weekdayNum, scheduleIdx) => {
        const addWeekdaysQuery = 'INSERT INTO weekdays (weekdayNum, scheduleIdx) VALUES (?,?)';
        return await pool.queryParam_Arr(addWeekdaysQuery, [weekdayNum, scheduleIdx])
            .catch((err) => {
                console.log('addWeekdays err : ' + err);

            })
    },
    getDeviceToken: async (userIdx) => {
        const getDeviceToken = `SELECT deviceToken FROM users WHERE userIdx = ?`
        return await pool.queryParam_Arr(getDeviceToken, [userIdx])
            .catch((err) => {
                console.log('getDeviceToken err : ' + err);
            })
    },
    deleteSchedule: async (scheduleIdx) => {
        const deleteStopsQuery = `DELETE FROM stops WHERE stops.stopIdx IN ( 
            SELECT detailsStops.stopIdx FROM detailsStops WHERE detailsStops.detailIdx IN ( 
                SELECT detailIdx FROM pathsDetails WHERE pathsDetails.pathIdx IN (
                    SELECT scheduleIdx FROM schedulesPaths WHERE scheduleIdx = ? ) ) )`;
        const deleteDetailsStopsQuery = `DELETE FROM detailsStops WHERE detailsStops.detailIdx IN ( 
            SELECT pathsDetails.detailIdx FROM pathsDetails WHERE pathsDetails.pathIdx IN (
                SELECT pathIdx FROM schedulesPaths WHERE schedulesPaths.scheduleIdx = ?) )`;
        const deleteDetailQuery = `DELETE FROM details WHERE details.detailIdx IN (
            SELECT pathsDetails.detailIdx FROM pathsDetails WHERE pathsDetails.pathIdx IN (
                SELECT pathIdx FROM schedulesPaths WHERE schedulesPaths.scheduleIdx = ?) )`;
        const deletePathsDetailsQuery = `DELETE FROM pathsDetails WHERE pathsDetails.pathIdx IN (
            SELECT pathIdx FROM schedulesPaths WHERE schedulesPaths.scheduleIdx = ?)`;
        const deletePathsQuery = `DELETE FROM paths WHERE paths.pathIdx IN (
            SELECT pathIdx FROM schedulesPaths WHERE schedulesPaths.scheduleIdx = ?)`;
        const deleteSchedulesPathQuery = `DELETE FROM paths WHERE paths.pathIdx IN (
            SELECT pathIdx FROM schedulesPaths WHERE schedulesPaths.scheduleIdx = ?)`;
        const deleteSchedulesNoticesQuery = `DELETE FROM paths WHERE paths.pathIdx IN (
            SELECT pathIdx FROM schedulesPaths WHERE schedulesPaths.scheduleIdx = ?)`;
        const deleteWeekdaysQuery = `DELETE FROM weekdays WHERE weekdays.scheduleIdx IN (
            SELECT scheduleIdx FROM schedules WHERE schedules.scheduleIdx = ?)`;
        const deleteSchedulesQuery = `DELETE FROM schedules WHERE scheduleIdx = ?`;
        const deleteUserSchedulesQuery = `SELECT * FROM usersSchedules WHERE scheduleIdx = ?`;
        const queryResult = [];
        return await pool.Transaction(async (connection) => {
            queryResult.push(await connection.query(deleteStopsQuery, scheduleIdx));
            queryResult.push(await connection.query(deleteDetailsStopsQuery, scheduleIdx));
            queryResult.push(await connection.query(deleteDetailQuery, scheduleIdx));
            queryResult.push(await connection.query(deletePathsDetailsQuery, scheduleIdx));
            queryResult.push(await connection.query(deletePathsQuery, scheduleIdx));
            queryResult.push(await connection.query(deleteSchedulesPathQuery, scheduleIdx));
            queryResult.push(await connection.query(deleteSchedulesNoticesQuery, scheduleIdx));
            queryResult.push(await connection.query(deleteWeekdaysQuery, scheduleIdx));
            queryResult.push(await connection.query(deleteSchedulesQuery, scheduleIdx));
            queryResult.push(await connection.query(deleteUserSchedulesQuery, scheduleIdx));
        }).then(async (result) => {
            return queryResult;
        }).catch((err) => {
            console.log('delete err : ' + err);
            throw err;
        })
    },
    updateSchedule: async (scheduleName, scheduleStartTime, startAddress, startLongitude, startLatitude, endAddress, endLongitude, endLatitude, scheduleIdx) => {
        const updateScheduleQuery = 'UPDATE schedules SET scheduleName=?, scheduleStartTime=?, startAddress=?, startLongitude=?, startLatitude=?, endAddress=?, endLongitude=?, endLatitude=? WHERE scheduleIdx = (?)';
        return await pool.queryParam_Arr(updateScheduleQuery, [scheduleName, scheduleStartTime, startAddress, startLongitude, startLatitude, endAddress, endLongitude, endLatitude, scheduleIdx])
            .catch((err) => {
                console.log('updateUsersSchedules err : ' + err);
            })
    },
    updatePaths: async (pathType, totalTime, totalPay, totalWalkTime, transitCount, pathIdx) => {
        const updatePathsQuery = 'UPDATE paths SET pathType=?, totalTime=?, totalPay=?, totalWalkTime=?, transitCount=? WHERE pathIdx=?';
        return await pool.queryParam_Arr(updatePathsQuery, [pathType, totalTime, totalPay, totalWalkTime, transitCount, pathIdx])
            .catch((err) => {
                console.log('updatePaths err : ' + err);
            })
    },
    updateWalk: (trafficType, distance, sectionTime, pathIdx, detailIdx) => {
        const updateWalkDetailQuery = `UPDATE details SET trafficType=?, distance=?, sectionTime=? WHERE detailIdx IN (
                                            SELECT detailIdx FROM details WHERE pathIdx = ?)`; //walk = 3 subway = 1, bus = 2
        const updatePathsDetailsQuery = 'UPDATE pathsDetails pathIdx =?, detailIdx =?';//RT
        return  pool.Transaction(async (conn) => {
            let updateWalkDetailResult = await conn.query(updateWalkDetailQuery, [trafficType, distance, sectionTime, pathIdx]);
            let updateWalkPathsDetailsResult = await conn.query(updatePathsDetailsQuery, [pathIdx, detailRes.insertId]);
            console.log('********************');
            console.log('걷기 수정 완료');
            console.log('********************');
        })
    },
    updateBus: (trafficType, distance, sectionTime, stationCount, detailStartAddress, detailStartLongitude, detailStartLatitude, detailEndAddress, detailEndLongitude, detailEndLatitude, busNo, busType, stopArray, pathIdx) => {
        const updateBusDetailQuery = 'UPDATE details SET (trafficType, distance, sectionTime, stationCount, detailStartAddress, detailStartLongitude, detailStartLatitude, detailEndAddress, detailEndLongitude, detailEndLatitude, busNo, busType) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)';
        const updateBusDetailsStopsQuery = 'UPDATE detailsStops SET (detailIdx, stopIdx) VALUES (?,?)';//RT
        const updateBusStopsQuery = 'UPDATE stops SET (stopName) VALUES (?)';
        const updatePathsDetailsQuery = 'UPDATE pathsDetails SET (pathIdx, detailIdx) VALUES (?,?)';//RT
        const updateSchedulesNoticesQuery = 'UPDATE schedulesNotices SET (scheduleIdx, arriveTime, noticeTime) VALUES (?,?,?)';
        return pool.Transaction(async (conn) => {
            let updateBusDetailResult = await conn.query(updateBusDetailQuery, [trafficType, distance, sectionTime, stationCount, detailStartAddress, detailStartLongitude, detailStartLatitude, detailEndAddress, detailEndLongitude, detailEndLatitude, busNo, busType]);
            for (var j = 0; j < stopArray.length; j++) {
                let updateBusStopsResult = await conn.query(updateBusStopsQuery, [stopArray[j].stationName]);
                let updateBusDetailsStopsResult = await conn.query(updateBusDetailsStopsQuery, [updateBusDetailResult.insertId, updateBusStopsResult.insertId]);
            }
            let updateBusPathsDetailsResult = await conn.query(updatePathsDetailsQuery, [pathIdx, updateBusDetailResult.insertId]);
            console.log('********************');
            console.log('버스 수정 완료');
            console.log('********************');
        })
            .catch((err) => {
                console.log('updateBus err : ' + err);
                return ({
                    code: statCode.BAD_REQUEST,
                    json: resUtil.successFalse(resMsg.NULL_VALUE)
                })
            })
    },
    updateSubway: (trafficType, distance, sectionTime, stationCount, subwayLane, detailStartAddress, detailStartLongitude, detailStartLatitude, detailEndAddress, detailEndLongitude, detailEndLatitude, stopArray, pathIdx) => {
        const updateSubwayDetailQuery = 'UPDATE details SET (trafficType, distance, sectionTime, stationCount, subwayLane, detailStartAddress, detailStartLongitude, detailStartLatitude, detailEndAddress, detailEndLongitude, detailEndLatitude) VALUES (?,?,?,?,?,?,?,?,?,?,?)';
        const updateSubwayStopsQuery = 'UPDATE stops SET (stopName) VALUES (?)';
        const updateSubwayDetailsStopsQuery = 'UPDATE detailsStops SET (detailIdx, stopIdx) VALUES (?,?)';//RT
        const updatePathsDetailsQuery = 'UPDATE pathsDetails SET (pathIdx, detailIdx) VALUES (?,?)';//RT
        return pool.Transaction(async (conn) => {
            let updateSubwayDetailResult = await conn.query(updateSubwayDetailQuery, [trafficType, distance, sectionTime, stationCount, subwayLane, detailStartAddress, detailStartLongitude, detailStartLatitude, detailEndAddress, detailEndLongitude, detailEndLatitude]);
            for (var i = 0; i < stopArray.length; i++) {
                let updateSubwayStopsResult = await conn.query(updateSubwayStopsQuery, [stopArray[i].stationName]);
                let updateSubwayDetailsStopsResult = await conn.query(updateSubwayDetailsStopsQuery, [updateSubwayDetailResult.insertId, updateSubwayStopsResult.insertId]);
            }
            await conn.query(updatePathsDetailsQuery, [pathIdx, updateSubwayDetailResult.insertId]);
            console.log('********************');
            console.log(' 지하철 추가 완료');
            console.log('********************')
        })
    },
    updateTime: async (arriveTime, noticeTime, scheduleIdx) => {
        const updateSchedulesNoticesQuery = 'UPDATE schedulesNotices SET (scheduleIdx, arriveTime, noticeTime) VALUES (?,?,?)';
        return await pool.Transaction((conn) => {
            conn.query(updateSchedulesNoticesQuery, [scheduleIdx, arriveTime, noticeTime]);
        })
    },
    updateSchedulesNotices: async (scheduleIdx, arriveTime, noticeTime) => {
        const updateSchedulesNoticesQuery = 'UPDATE schedulesNotices SET (scheduleIdx, arriveTime, noticeTime) VALUES (?,?,?)';
        return await pool.queryParam_Arr(updateSchedulesNoticesQuery, [scheduleIdx, arriveTime, noticeTime])
            .catch((err) => {
                console.log('updateSchedulesNotices err : ' + err);

            })
    },
    updateUsersSchedules: async (userIdx, scheduleIdx) => { //RT
        const updateUsersSchedulesQuery = 'UPDATE usersSchedules SET (userIdx, scheduleIdx) VALUES (?,?)';
        return await pool.queryParam_Arr(updateUsersSchedulesQuery, [userIdx, scheduleIdx])
            .catch((err) => {
                console.log('updateUsersSchedules err : ' + err);

            })
    },
    updateSchedulesPaths: async (scheduleIdx, pathIdx) => {
        const updateSchedulesPathsQuery = 'UPDATE schedulesPaths SET (scheduleIdx, pathIdx) VALUES  (?,?)'; //RT
        return await pool.queryParam_Arr(updateSchedulesPathsQuery, [scheduleIdx, pathIdx])
            .catch((err) => {
                console.log('updatePaths err : ' + err);

            })
    },

    updateWeekdays: async (weekdayNum, scheduleIdx) => {
        const updateWeekdaysQuery = 'UPDATE weekdays SET (weekdayNum, scheduleIdx) VALUES (?,?)';
        return await pool.queryParam_Arr(updateWeekdaysQuery, [weekdayNum, scheduleIdx])
            .catch((err) => {
                console.log('updateWeekdays err : ' + err);

            })
    },
    getSchedules: async (scheduleIdx) => {
        const getSchedulesQuery = `SELECT * FROM schedules LEFT JOIN schedulesPaths ON schedules.scheduleIdx = schedulesPaths.scheduleIdx
        LEFT JOIN paths ON paths.pathIdx = schedulesPaths.pathIdx WHERE schedules.scheduleIdx = ?`;
        return await pool.queryParam_Arr(getSchedulesQuery, [scheduleIdx])
            .catch((err) => {
                console.log('getSchedulesQuery err : ' + err);
            })
    }
}