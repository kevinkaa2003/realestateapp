import './ManageBooking.css';
import Navbar from './Custom_Navbar_J';
import CustomFooter from './Custom_Footer_J';
import { useState, useEffect, useContext } from 'react';
import { DataContext } from './DataProvider';

const ManageBookings = () => {

    const [savedScroll, setSavedScroll] = useState(0);
    const today = new Date();
    const [selectedYear, setSelectedYear] = useState(today.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
    const [ reservationData, setReservationData ] = useState([]);
    const [selectedReservation, setSelectedReservation] = useState(null);
    const [ editReservation, setEditReservation ] = useState(false);
    const [editedReservation, setEditedReservation] = useState({});
    const { dormitoryPrice, setDormitoryPrice, doubleSharedPrice, setDoubleSharedPrice, doublePrivatePrice, setDoublePrivatePrice, japaneseTwinPrice, setJapenseTwinPrice, fourBedPrice, setFourBedPrice } = useContext(DataContext);

    //Room Option Variables
    const roomTypeOptionsArray = ['Dormitory', 'Double Room Shared Toilet & Shower', 'Double Room Private Toilet & Bath', 'Japanese Twin Room', '4 Bed Room']
    const dormitoryRooms = ['202A', '202B', '202C', '202D', '202E', '202F', '202G', '202H', '202I', '202K', '202L', '203A', '203B', '203C', '203D', '203E', '203F', '203G', '203H', '203I', '203K', '203L', '204A', '204B', '204C', '204D', '204E', '204F', '204G', '204H', '204I', '204K', '204L'];
    const doubleSharedRooms = ['201', '205'];
    const doubleRoomPrivate = ['206', '207'];
    const japaneseTwinRooms = ['301', '302', '303', '304', '305', '306', '307'];
    const fourbedRooms = ['401', '402', '403', '404', '405', '406'];



    //Calendar Generation Helper
    function getDaysInMonth(month, year) {
        return new Date(year, month + 1, 0).getDate();
    };

    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const [selectedDay, setSelectedDay] = useState(null); // e.g. '2025-06-12'
    const [showDayModal, setShowDayModal] = useState(false);
    const [dayReservations, setDayReservations] = useState([]);

    //Helper function to get all reservations for a given day
    const getReservationsForDate = (dateStr) => {
        return reservationData.filter(res => {
            const start = new Date(res["Start Date"]);
            const end = new Date(res["End Date"]);
            const d = new Date(dateStr);
            return d >= start && d <= end;
        });
        };

    //Handler for clicking a day
    const handleDayClick = (dateStr) => {
        const reservations = getReservationsForDate(dateStr);
        setDayReservations(reservations);
        setSelectedDay(dateStr);
        setShowDayModal(true);
    };

    //Handler for selecting a reservation within the day
    const handleReservationClick = (reservation) => {
        setSelectedReservation(reservation);
        setEditReservation(false);
        setShowDayModal(false);
    };

    //Calculate Total rooms in building
    const totalRooms = dormitoryRooms.length + doubleSharedRooms.length + doubleRoomPrivate.length + japaneseTwinRooms.length + fourbedRooms.length;

    const DisplayMonth = () => {
        const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
        const firstDay = new Date(selectedYear, selectedMonth, 1).getDay();

        const rows = [];
        let cells = [];

        for (let i = 0; i < firstDay; i++) {
            cells.push(<td key={`empty-${i}`}></td>);
        }

         for (let day = 1; day <= daysInMonth; day++) {
            const dateObj = new Date(selectedYear, selectedMonth, day);
            const yyyy = dateObj.getFullYear();
            const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
            const dd = String(dateObj.getDate()).padStart(2, '0');
            const dateStr = `${yyyy}-${mm}-${dd}`;
            const reservationsForDay = getReservationsForDate(dateStr);
            const numReservations = reservationsForDay.length;
            const uniqueRooms = new Set(reservationsForDay.map(r => r["Room Number"]));
            const isHotelFull = uniqueRooms.size >= totalRooms;


            cells.push(
                <td
                    key={`${selectedYear}-${selectedMonth}-${day}`}
                    className={isHotelFull ? "hotel-full" : ""}
                    style={{ position: "relative", cursor: "pointer", background: isHotelFull ? "#ffcccc" : undefined }}
                    onClick={() => handleDayClick(dateStr)}
                >
                    <div className="calendardaynumber">{day}</div>
                    {isHotelFull ? (
                        <div style={{ color: "red", fontWeight: "bold" }}>ホテル満室</div>
                    ) : (
                        <div className="reservationtotal">{numReservations} 予約{numReservations !== 1 ? "s" : ""}</div>
                    )}
                </td>
            );
            if ((cells.length) % 7 === 0) {
                rows.push(<tr key={`row-${day}`}>{cells}</tr>);
                cells = [];
            }
        }

        if (cells.length) {
            while (cells.length < 7) {
                cells.push(<td key={`empty-end-${cells.length}`}></td>);
            }
            rows.push(<tr key="row-last">{cells}</tr>);
        }

        return (
            <>
                <div className="bookingmanagercalendarbody">
                    <div className="calendarcontrols">
                        <select
                            value={selectedMonth}
                            onChange={e => {
                            setSelectedMonth(Number(e.target.value));
                            }}
                        >
                        {months.map((m, idx) => (
                        <option key={m} value={idx}>{m}</option>
                        ))}
                    </select>
                    <input
                        className="yearselection"
                        type="number"
                        value={selectedYear}
                        onChange={e => {
                        setSelectedYear(Number(e.target.value));
                        }}
                    />
                    <br/>
                    <br/>
                    <br/>
                    <br/>
                    </div>
                    <div className="calendartablewrapper">
                        <table className="calendartable">
                            <thead>
                                <tr>
                                    <th>Su</th><th>Mo</th><th>Tu</th><th>We</th><th>Th</th><th>Fr</th><th>Sa</th>
                                </tr>
                            </thead>
                            <tbody>{rows}</tbody>
                        </table>
                    </div>
                </div>
                {/* Day Modal */}
                {showDayModal && (
                    <div className="reservationmodaloverlay" onClick={() => setShowDayModal(false)}>
                        <div className="reservationmodalcontentcalendar" onClick={e => e.stopPropagation()}>
                            <h3>ご予約 {selectedDay}</h3>
                            <br/>

                            {dayReservations.length === 0 ? (
                                <>
                                <div>この日は予約がありません。</div>
                                <br/>
                                </>
                            ) : (
                                <ul>
                                    {dayReservations.map(res => (
                                        <>
                                        <li key={res["Reservation ID"]} style={{ marginBottom: "10px", cursor: "pointer" }} onClick={() => handleReservationClick(res)}>
                                            <strong>{res["Name"]}: </strong> 部屋 {res["Room Number"]}, {res["Room Option"]}, チェックイン: {res["Check In"]}, チェックアウト: {res["Check Out"]}
                                        </li>
                                        <br/>
                                        </>
                                    ))}
                                </ul>
                            )}
                            <button className="closemodalbtn" onClick={() => setShowDayModal(false)}>近い</button>
                        </div>
                    </div>
                )}
            </>
        );
    };

    //Get Reservation Data Function
    const getReservationData = async () => {


        //GET request
        try {
            const response = await fetch('http://localhost:5000/reservationdata',
                {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include', //This allows cookies to be sent and received
                }
            );


            const data = await response.json();

            //Valid response check
            if (response.ok) {
                setReservationData(data.data);
                console.log('Reservations Received');
            }
        } catch (error) {
            console.error("Error Retrieving Reservations:", error.response ? error.response.data : error.message);
        }
    };

    useEffect(() => {
        getReservationData();
    }, []);

    useEffect(() => {
        console.log("Rservation Data: ", reservationData);
    }, [reservationData]);

    // Helper to get price per room type
    const getRoomPrice = (roomOption) => {
        switch(roomOption) {
            case 'Dormitory': return dormitoryPrice;
            case 'Double Room Shared Toilet & Shower': return doubleSharedPrice;
            case 'Double Room Private Toilet & Bath': return doublePrivatePrice;
            case 'Japanese Twin Room': return japaneseTwinPrice;
            case '4 Bed Room': return fourBedPrice;
            default: return 0;
        }
    };

    // Helper to get number of nights (exclusive of end date)
    const getNights = (startDate, endDate) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        // Nights = difference in days (exclusive of end date)
        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.max(1, diffDays);
    };

    // Calculate total for the current edit form
    const getEditTotal = () => {
        const startDate = editedReservation["Start Date"] || selectedReservation["Start Date"];
        const endDate = editedReservation["End Date"] || selectedReservation["End Date"];
        const roomOption = editedReservation["Room Option"] || selectedReservation["Room Option"];
        if (!startDate || !endDate || !roomOption) return 0;
        const nights = getNights(startDate, endDate);
        const price = getRoomPrice(roomOption);
        return (nights * price).toFixed(2);
    };

    const deleteReservation = async (reservation) => {
        try {
            const response = await fetch('http://localhost:5000/reservationdelete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reservationId: reservation["Reservation ID"] }),
            credentials: 'include',
            });

            if (response.ok) {
                getReservationData();
                setSelectedReservation(null);
                setEditReservation(false);
                alert("予約を削除しました")
            } else {
                alert("予約の削除に失敗しました。");
            }
        } catch (error) {
            console.error("Error Deleting Reservation: ", error);
        }
    }

    //Calendar for showing reservation date ranges

    // State for reservation calendar modal
    const [showReservationCalendar, setShowReservationCalendar] = useState(false);
    const [calendarReservation, setCalendarReservation] = useState(null);

    const showOnCalendar = (reservation) => {
        setCalendarReservation(reservation);
        setShowReservationCalendar(true);
    };

    // Helper: get all dates between two dates (inclusive)
    function getDatesBetween(start, end) {
        const arr = [];
        // Parse start and end as year, month, day (local)
        const [sy, sm, sd] = start.split('-').map(Number);
        const [ey, em, ed] = end.split('-').map(Number);
        let dt = new Date(sy, sm - 1, sd);
        const endDt = new Date(ey, em - 1, ed);
        while (dt <= endDt) {
            const yyyy = dt.getFullYear();
            const mm = String(dt.getMonth() + 1).padStart(2, '0');
            const dd = String(dt.getDate()).padStart(2, '0');
            arr.push(`${yyyy}-${mm}-${dd}`);
            dt.setDate(dt.getDate() + 1);
        }
        return arr;
    }

    const ReservationsTable = () => (
        <div className="reservationstablewrapper">
            <h2>予約</h2>
            <br />
            <br />
            <table>
            <thead>
                <tr>
                <th>名前</th>
                <th>開始日</th>
                <th>終了日</th>
                <th>部屋番号</th>
                <th>部屋オプション</th>
                <th>人々</th>
                <th>合計</th>
                <th>予約ID</th>
                <th>チェックイン</th>
                <th>チェックアウト</th>
                </tr>
            </thead>
            <tbody>
                {reservationData.map((res, idx) => (
                <tr
                    key={idx}
                    onClick={() => { setSelectedReservation(res); setEditReservation(false); }}
                    className="reservationrow"
                >
                    <td>{res["Name"]}</td>
                    <td>{res["Start Date"]}</td>
                    <td>{res["End Date"]}</td>
                    <td>{res["Room Number"]}</td>
                    <td>{res["Room Option"]}</td>
                    <td>{res["People"]}</td>
                    <td>{res["Total"]}</td>
                    <td>{res["Reservation ID"]}</td>
                    <td>{res["Check In"]}</td>
                    <td>{res["Check Out"]}</td>
                </tr>
                ))}
            </tbody>
            </table>
            {/* Modal logic */}
            {selectedReservation && (
            <div
                className="reservationmodaloverlay"
                onClick={() => { setSelectedReservation(null); setEditReservation(false); }}
            >
                <div className="reservationmodalcontent" onClick={e => e.stopPropagation()}>
                <h3>予約の詳細</h3>
                <br />
                {editReservation ? (
                    <form
                        onSubmit={async (e) => {
                        e.preventDefault();

                        const startDate = (editedReservation["Start Date"] || selectedReservation["Start Date"]).slice(0, 10);
                        const endDate = (editedReservation["End Date"] || selectedReservation["End Date"]).slice(0, 10);
                        const roomOption = editedReservation["Room Option"] || selectedReservation["Room Option"];
                        const roomNumber = editedReservation["Room Number"] || selectedReservation["Room Number"];
                        const reservationId = selectedReservation["Reservation ID"];

                        const otherReservations = reservationData.filter(
                            r => r["Room Option"] === roomOption &&
                                r["Room Number"] === roomNumber &&
                                r["Reservation ID"] !== reservationId
                        );

                        const optionReservations = reservationData.filter(
                            r => r["Room Option"] === roomOption &&
                                r["Reservation ID"] !== reservationId
                        );

                        const getDatesBetween = (start, end) => {
                            const arr = [];
                            let dt = new Date(start);
                            const endDt = new Date(end);
                            while (dt <= endDt) {
                                arr.push(dt.toISOString().slice(0, 10));
                                dt.setDate(dt.getDate() + 1);
                            }
                            return arr;
                        };

                        // 1. Conflict check (same room number)
                        const hasConflict = otherReservations.some(r =>
                            !(endDate <= r["Start Date"] || startDate >= r["End Date"])
                        );
                        if (hasConflict) {
                            alert("この部屋は選択した日付ですでに予約されています。");
                            return;
                        }

                        // 2. Fully booked check
                        const roomCount =
                            roomOption === "Dormitory" ? dormitoryRooms.length :
                            roomOption === "Double Room Shared Toilet & Shower" ? doubleSharedRooms.length :
                            roomOption === "Double Room Private Toilet & Bath" ? doubleRoomPrivate.length :
                            roomOption === "Japanese Twin Room" ? japaneseTwinRooms.length :
                            roomOption === "4 Bed Room" ? fourbedRooms.length : 0;

                        const dateRoomMap = {};
                        for (const r of optionReservations) {
                            const rDates = getDatesBetween(r["Start Date"], r["End Date"]);
                            for (const d of rDates) {
                                dateRoomMap[d] = (dateRoomMap[d] || 0) + 1;
                            }
                        }

                        const isFullyBooked = (date) => (dateRoomMap[date] || 0) >= roomCount;
                        const shiftDate = (d, offset) => {
                            const date = new Date(d);
                            date.setDate(date.getDate() + offset);
                            return date.toISOString().slice(0, 10);
                        };

                        const isFirstDayOfFullyBookedRange = (date) =>
                            isFullyBooked(date) && !isFullyBooked(shiftDate(date, -1));

                        const isLastDayOfFullyBookedRange = (date) =>
                            isFullyBooked(date) && !isFullyBooked(shiftDate(date, 1));

                        const dateRange = getDatesBetween(startDate, endDate);
                        const middleRange = dateRange.slice(1, -1);

                        const startIsValid = !isFullyBooked(startDate) || isLastDayOfFullyBookedRange(startDate);
                        const endIsValid = !isFullyBooked(endDate) || isFirstDayOfFullyBookedRange(endDate);
                        const middleIsValid = !middleRange.some(isFullyBooked);

                        if (!startIsValid) {
                            alert("完全に予約された範囲の最終日でない限り、開始日は完全に予約された日付にすることはできません。");
                            return;
                        }
                        if (!endIsValid) {
                            alert("終了日は、満席の範囲の最初の日でない限り、満席の日付にすることはできません。");
                            return;
                        }
                        if (!middleIsValid) {
                            alert("開始から終了までの間に満席の日が含まれる日付は選択できません。");
                            return;
                        }

                        // 3. Submit if valid
                        const updatedReservation = { ...selectedReservation, ...editedReservation };
                        try {
                            const response = await fetch('http://localhost:5000/reservationdataupdate', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(updatedReservation),
                                credentials: 'include',
                            });
                            if (response.ok) {
                                getReservationData();
                                setSelectedReservation(updatedReservation);
                                setEditReservation(false);
                            }
                        } catch (error) {
                            console.error("Failed to Update Reservation: ", error);
                            alert('予約の更新中にエラーが発生しました。');
                        }
                    }}

                    >

                        <ul>
                            {/* Name */}
                            <li>
                            <strong>名前:</strong>
                            <input
                                type="text"
                                value={editedReservation["Name"] !== undefined ? editedReservation["Name"] : selectedReservation["Name"]}
                                onChange={e => setEditedReservation(prev => ({ ...prev, ["Name"]: e.target.value }))}
                                required
                            />
                            </li>
                            {/* Start Date */}
                            <li>
                            <strong>開始日:</strong>
                            <input
                                type="date"
                                value={editedReservation["Start Date"] !== undefined ? editedReservation["Start Date"] : selectedReservation["Start Date"]}
                                onChange={e => setEditedReservation(prev => ({ ...prev, ["Start Date"]: e.target.value }))}
                                required
                            />
                            </li>
                            {/* End Date */}
                            <li>
                            <strong>終了日:</strong>
                            <input
                                type="date"
                                value={editedReservation["End Date"] !== undefined ? editedReservation["End Date"] : selectedReservation["End Date"]}
                                onChange={e => setEditedReservation(prev => ({ ...prev, ["End Date"]: e.target.value }))}
                                required
                            />
                            </li>
                            {/* Room Option */}
                            <li>
                            <strong>部屋オプション:</strong>
                            <select
                                value={editedReservation["Room Option"] !== undefined ? editedReservation["Room Option"] : selectedReservation["Room Option"]}
                                onChange={e => {
                                    const newRoomOption = e.target.value;
                                    let defaultRoom = "";
                                    if (newRoomOption === 'Dormitory') defaultRoom = dormitoryRooms[0];
                                    else if (newRoomOption === 'Double Room Shared Toilet & Shower') defaultRoom = doubleSharedRooms[0];
                                    else if (newRoomOption === 'Double Room Private Toilet & Bath') defaultRoom = doubleRoomPrivate[0];
                                    else if (newRoomOption === 'Japanese Twin Room') defaultRoom = japaneseTwinRooms[0];
                                    else if (newRoomOption === '4 Bed Room') defaultRoom = fourbedRooms[0];
                                    setEditedReservation(prev => ({
                                    ...prev,
                                    ["Room Option"]: newRoomOption,
                                    ["Room Number"]: defaultRoom // set default room number
                                    }));
                                }}
                                required
                                >
                                {roomTypeOptionsArray.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                                </select>
                            </li>
                            {/* Room Number */}
                            <li>
                            <strong>部屋番号:</strong>
                            <select
                                value={editedReservation["Room Number"] !== undefined ? editedReservation["Room Number"] : selectedReservation["Room Number"]}
                                onChange={e => setEditedReservation(prev => ({ ...prev, ["Room Number"]: e.target.value }))}
                                required
                            >
                                {(() => {
                                const roomType = editedReservation["Room Option"] !== undefined ? editedReservation["Room Option"] : selectedReservation["Room Option"];
                                if (roomType === 'Dormitory') return dormitoryRooms.map(r => <option key={r} value={r}>{r}</option>);
                                if (roomType === 'Double Room Shared Toilet & Shower') return doubleSharedRooms.map(r => <option key={r} value={r}>{r}</option>);
                                if (roomType === 'Double Room Private Toilet & Bath') return doubleRoomPrivate.map(r => <option key={r} value={r}>{r}</option>);
                                if (roomType === 'Japanese Twin Room') return japaneseTwinRooms.map(r => <option key={r} value={r}>{r}</option>);
                                if (roomType === '4 Bed Room') return fourbedRooms.map(r => <option key={r} value={r}>{r}</option>);
                                return null;
                                })()}
                            </select>
                            </li>
                            {/* People */}
                            <li>
                            <strong>人々:</strong>
                            <input
                                type="number"
                                min={1}
                                value={editedReservation["People"] !== undefined ? editedReservation["People"] : selectedReservation["People"]}
                                onChange={e => setEditedReservation(prev => ({ ...prev, ["People"]: e.target.value }))}
                                required
                            />
                            </li>
                            {/* Total */}
                            <li>
                                <strong>合計:</strong> ¥{getEditTotal()}
                            </li>
                            {/* Reservation ID (read-only) */}
                            <li>
                            <strong>予約ID: </strong>
                                {selectedReservation["Reservation ID"]}
                            </li>
                            {/* Check In */}
                            <li>
                            <strong>チェックイン:</strong>
                                <select
                                    value={editedReservation["Check In"] !== undefined ? editedReservation["Check In"] : selectedReservation["Check In"] || "Yes"}
                                    onChange={e => {
                                        const newValue = e.target.value;
                                        const checkOutValue = editedReservation["Check Out"] !== undefined ? editedReservation["Check Out"] : selectedReservation["Check Out"];
                                        if (checkOutValue === "Yes" && newValue === "No") {
                                            alert("チェックアウトが「はい」の場合、チェックインに「いいえ」を選択することはできません。");
                                            return;
                                        }
                                        setEditedReservation(prev => ({ ...prev, ["Check In"]: newValue }));
                                    }}
                                    required
                                >
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                </select>
                            </li>
                            {/* Check Out */}
                            <li>
                                <strong>チェックアウト:</strong>
                                <select
                                    value={editedReservation["Check Out"] !== undefined ? editedReservation["Check Out"] : selectedReservation["Check Out"] || "yes"}
                                    onChange={e => {
                                    const newValue = e.target.value;
                                    const checkInValue = editedReservation["Check In"] !== undefined ? editedReservation["Check In"] : selectedReservation["Check In"];
                                    if (checkInValue === "No" && newValue === "Yes") {
                                        alert("チェックインが「いいえ」の場合、チェックアウトに「はい」を選択することはできません。");
                                        return;
                                    }
                                    setEditedReservation(prev => ({ ...prev, ["Check Out"]: newValue }));
                                    }}
                                    required
                                >
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                </select>
                            </li>
                        </ul>
                        <br />
                        <div className="reservationdetailsbuttons">
                            <button type="button" className="closemodalbtn" onClick={() => setEditReservation(false)}>
                            キャンセル
                            </button>
                            <button type="submit" className="editreservationbtn">
                            保存
                            </button>
                        </div>
                        </form>
                ) : (
                    <>
                    <ul>
                        {Object.entries(selectedReservation).map(([key, value]) => (
                        <li key={key}>
                            <strong>{key}:</strong> {value?.toString()}
                        </li>
                        ))}
                    </ul>
                    <br />
                    <div className="reservationdetailsbuttons">
                        <button className="closemodalbtn" onClick={() => setSelectedReservation(null)}>
                        予約を閉じる
                        </button>
                        <button className="editreservationbtn" onClick={() => {
                        setEditReservation(true);
                        setEditedReservation(selectedReservation);
                        }}>
                        予約の編集
                        </button>
                        <button className="deletereservationbtn" onClick={() => deleteReservation(selectedReservation)}>
                        予約を削除
                        </button>
                        <button
                            className="showoncalendarbtn"
                            onClick={() => showOnCalendar(selectedReservation)}
                            >
                            カレンダーに表示
                        </button>
                    </div>
                    </>
                )}
                </div>
            </div>
            )}
        </div>
    );

    const ReservationCalendarModal = ({ reservation }) => {

        const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
        const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());

        useEffect(() => {
            if (reservation) {
                setCalendarYear(new Date(reservation["Start Date"]).getFullYear());
                setCalendarMonth(new Date(reservation["Start Date"]).getMonth());
            }
        }, [reservation]);


        if (!reservation) return null;

        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

        // Get all dates the reservation occupies
        const reservationDates = new Set(getDatesBetween(reservation["Start Date"], reservation["End Date"]));
        const roomNumber = reservation["Room Number"];

        // Calendar rendering logic for selected month/year
        const daysInMonth = getDaysInMonth(calendarMonth, calendarYear);
        const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
        const rows = [];
        let cells = [];
        for (let i = 0; i < firstDay; i++) {
            cells.push(<td key={`empty-${i}`}></td>);
        }
        for (let day = 1; day <= daysInMonth; day++) {
            const yyyy = calendarYear;
            const mm = String(calendarMonth + 1).padStart(2, '0');
            const dd = String(day).padStart(2, '0');
            const dateStr = `${yyyy}-${mm}-${dd}`;
            const isReserved = reservationDates.has(dateStr);
            cells.push(
                <td
                    key={`${yyyy}-${calendarMonth}-${day}`}
                    style={{
                        background: isReserved ? "#3ae13a" : undefined,
                        textAlign: "center",
                        fontWeight: isReserved ? "bold" : undefined,
                        color: isReserved ? "red" : undefined,
                        position: "relative"
                    }}
                >
                    <div className="calendardaynumber">{day}</div>
                    {isReserved && (
                        <div style={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            fontSize: "1.1em"
                        }}>
                            {roomNumber}
                        </div>
                    )}
                </td>
            );
            if ((cells.length) % 7 === 0) {
                rows.push(<tr key={`row-${day}`}>{cells}</tr>);
                cells = [];
            }
        }
        if (cells.length) {
            while (cells.length < 7) {
                cells.push(<td key={`empty-end-${cells.length}`}></td>);
            }
            rows.push(<tr key="row-last">{cells}</tr>);
        }

        return (

            <>
            <div className="calendarcontrols">
                    <select
                        value={calendarMonth}
                        onChange={e => setCalendarMonth(Number(e.target.value))}
                    >
                        {months.map((m, idx) => (
                            <option key={m} value={idx}>{m}</option>
                        ))}
                    </select>
                    <input
                        className="yearselection"
                        type="number"
                        value={calendarYear}
                        onChange={e => setCalendarYear(Number(e.target.value))}
                    />
            </div>
            <br/>
            <div className="calendartablewrapper">
                <table className="calendartable">
                    <thead>
                        <tr>
                            <th>Su</th><th>Mo</th><th>Tu</th><th>We</th><th>Th</th><th>Fr</th><th>Sa</th>
                        </tr>
                    </thead>
                    <tbody>{rows}</tbody>
                </table>
            </div>
        </>
        );
    };

    const [ editRoomPrices, setEditRoomPrices ] = useState(false);

    const ChangeRoomPrices = () => {
        // Local state for editing prices
        const [localPrices, setLocalPrices] = useState({
            dormitory: dormitoryPrice,
            doubleShared: doubleSharedPrice,
            doublePrivate: doublePrivatePrice,
            japaneseTwin: japaneseTwinPrice,
            fourBed: fourBedPrice
        });

        // When entering edit mode, sync local state with context
        useEffect(() => {
            if (editRoomPrices) {
                setLocalPrices({
                    dormitory: dormitoryPrice,
                    doubleShared: doubleSharedPrice,
                    doublePrivate: doublePrivatePrice,
                    japaneseTwin: japaneseTwinPrice,
                    fourBed: fourBedPrice
                });
                window.scrollTo(0, savedScroll);
            }
        }, [editRoomPrices]);

        // Handlers for input changes
        const handleInputChange = (key, value) => {
            setLocalPrices(prev => ({ ...prev, [key]: value }));
        };

        // Confirm and update context
        const handleConfirm = () => {
            setDormitoryPrice(localPrices.dormitory);
            setDoubleSharedPrice(localPrices.doubleShared);
            setDoublePrivatePrice(localPrices.doublePrivate);
            setJapenseTwinPrice(localPrices.japaneseTwin);
            setFourBedPrice(localPrices.fourBed);
            setEditRoomPrices(false);
        };

        return (
            <>
                {!editRoomPrices && (
                    <div className="roompricewrapper">
                        <div className="roompricetitle">
                            <h2>客室料金</h2>
                        </div>
                        <div className="roompriceslist">
                            <ul>
                                <li>
                                    <h3>寮費: </h3><p>¥{dormitoryPrice}</p>
                                </li>
                                <li>
                                    <h3>ダブルシェアルーム料金: </h3><p>¥{doubleSharedPrice}</p>
                                </li>
                                <li>
                                    <h3>ダブル個室料金: </h3><p>¥{doublePrivatePrice}</p>
                                </li>
                                <li>
                                    <h3>和室ツインルーム料金: </h3><p>¥{japaneseTwinPrice}</p>
                                </li>
                                <li>
                                    <h3>4ベッドルーム料金: </h3><p>¥{fourBedPrice}</p>
                                </li>
                            </ul>
                        </div>
                        <br/>
                        <br/>
                        <button className="editroompricesbtn" onClick={() => {
                            setSavedScroll(window.scrollY);
                            setEditRoomPrices(true);
                        }}>客室料金を編集</button>
                    </div>
                )}

                {editRoomPrices && (
                    <div className="roompricewrapper">
                        <div className="roompricetitle">
                            <h2>客室料金</h2>
                        </div>
                        <div className="roompriceslist">
                            <ul>
                                <li>
                                    <h3>寮費: ¥</h3>
                                     <input type="number" value={localPrices.dormitory} onChange={e => handleInputChange('dormitory', e.target.value)} />
                                </li>
                                <li>
                                    <h3>ダブルシェアルーム料金: ¥</h3>
                                    <input type="number" value={localPrices.doubleShared} onChange={e => handleInputChange('doubleShared', e.target.value)} />
                                </li>
                                <li>
                                    <h3>ダブル個室料金: ¥</h3>
                                    <input type="number" value={localPrices.doublePrivate} onChange={e => handleInputChange('doublePrivate', e.target.value)} />
                                </li>
                                <li>
                                    <h3>和室ツインルーム料金: ¥</h3>
                                    <input type="number" value={localPrices.japaneseTwin} onChange={e => handleInputChange('japaneseTwin', e.target.value)} />
                                </li>
                                <li>
                                    <h3>4ベッドルーム料金: ¥</h3>
                                    <input type="number" value={localPrices.fourBed} onChange={e => handleInputChange('fourBed', e.target.value)} />
                                </li>
                            </ul>
                        </div>
                        <br/>
                        <br/>
                        <button className="editroompricesbtn" onClick={handleConfirm}>客室料金を確認する</button>
                    </div>
                )}
            </>
        );
    }



    return (
        <>
        <Navbar/>
        <br/>
        <br/>
        <br/>
        <br/>
        <div className="bookingsmanager">
            <h2>予約の管理</h2>
            <DisplayMonth/>
            {showReservationCalendar && calendarReservation && (
                <div className="reservationcalendaroverlay" onClick={() => setShowReservationCalendar(false)}>
                    <div className="reservationmodalcontentcalendar" onClick={e => e.stopPropagation()}>
                    <h3>
                        予約カレンダー:
                        <br/>
                        {calendarReservation["Name"]} (部屋 {calendarReservation["Room Number"]})
                    </h3>
                    <br />
                    <ReservationCalendarModal reservation={calendarReservation} />
                    <br/>
                    <button className="closemodalbtn" onClick={() => setShowReservationCalendar(false)}>
                        カレンダーを閉じる
                    </button>
                    </div>
                </div>
                )}
            </div>
        <ReservationsTable/>
        <br/>
        <ChangeRoomPrices/>
        <CustomFooter/>
        </>
    )
}

export default ManageBookings;
