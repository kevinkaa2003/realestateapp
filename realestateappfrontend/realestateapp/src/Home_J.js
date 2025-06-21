import logo from './logo.svg';

import React, { useEffect, useState, createContext, useContext, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { BrowserRouter, Route, Routes, Router } from 'react-router-dom';
import Navbar from './Custom_Navbar_J.js';
import CustomFooter from './Custom_Footer_J.js';
import Slideshow from './Custom_Slideshow_J.js'
import { DataContext } from './DataProvider.js';
import tokyo3 from './tokyoguesthouse3.png';
import tokyo4 from './tokyoguesthouse4.png';
import './Home.css';

//Home component
const Home = () => {
    const navigate = useNavigate();
    const goToBooking = () => {
        navigate('/Booking');
    }

    const goToContact = () => {
        navigate('/Contact');
    }
    return (
        <>
        <Navbar/>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <Slideshow/>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <div className="homeinfowrapper">
            <div className="conceptinfo">
                <h1>コンセプト</h1>
                <p>東京ゲストハウス王子ミュージックラウンジは2017年にオープンしました。JR王子駅から徒歩約3分、上野などの主要スポットにも近く、公園や美しい日本の街並みに囲まれたゲストハウスです。</p>
                <br/>
                <p>音楽を通して、世界中のミュージシャンや音楽愛好家の皆様と素晴らしい時間を共有したいと思っています。どうぞ楽しいひとときをお過ごしください。皆様のご来場をお待ちしております。</p>
            </div>
            <div className="hostelinfo">
                <h1>ホステル</h1>
                <h4>チェックイン:</h4>
                <p>14:00 - 22:00</p>
                <h4>チェックアウト:</h4>
                <p>7:00 - 10:00</p>
                <span>ゲストハウスでは、ドミトリータイプのお部屋から個室まで、様々なタイプのお部屋をご用意しております。長期滞在やグループでのご利用もお気軽にお問い合わせください。</span>
                <div className="hostelcontactbuttons">
                    <button onClick={goToBooking}>今すぐ予約</button>
                    <button onClick={goToContact}>お問い合わせ</button>
                </div>
            </div>
            <div className="foodinfo">
                <img src={tokyo3}/>
                <br/>
                <br/>
                <br/>
                <h1>食べ物と飲み物</h1>
                <h4>カフェ＆バー:</h4>
                <p>11:30 - 22:00</p>
                <h4>ランチ:</h4>
                <p>11:30 - 15:00</p>
                <div className="fooddescription">
                    <p>カフェスペースはご宿泊のお客様だけでなく、一般の方にもご利用いただけます。オリジナルのカフェメニューから、自家製窯焼きピザまで、豊富なフード＆ドリンクをご用意しております。</p>
                </div>
            </div>
            <div className="musicloungeinfo">
                <img src={tokyo4}/>
                <br/>
                <br/>
                <br/>
                <h1>ミュージックラウンジ</h1>
                <div className="musicloungedescription">
                    <p>1階のミュージックラウンジでは、ホストミュージシャンやその他のアーティストによるライブコンサートが定期的に開催されています。また、エレクトリックピアノやギターの演奏も可能です。</p>
                </div>
            </div>
        </div>
        <CustomFooter></CustomFooter>
        </>
    );
}

export default Home;
