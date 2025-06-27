import React, { useState } from 'react';
import { Route, BrowserRouter, Routes } from 'react-router-dom';
import { FloatButton, Tooltip } from 'antd';
import { MessageOutlined, FacebookOutlined, InstagramOutlined, LinkedinOutlined, WhatsAppOutlined } from '@ant-design/icons';
import { BiX } from 'react-icons/bi';
import { BiLogoTelegram } from 'react-icons/bi';
import Chat from './Components/Chat';
import Auth from './Components/Auth';
import Video from './Components/Video1'
import { persistor, store } from './store';
import { PersistGate } from 'redux-persist/integration/react';
import { Provider } from 'react-redux';
import Video1 from './Components/Video1';

const defaultAppColor = '#1890ff';

const App = () => {
  const [showIcons, setShowIcons] = useState(false);

  const handleButtonClick = () => {
    setShowIcons(!showIcons);
  };

  if (typeof process === 'undefined') {
    //@ts-ignore
    window.process = {
      nextTick: (callback) => setTimeout(callback, 0),
    };
  }


  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Auth />} />
            <Route path="/chat" element={<Chat />} />
            {/* <Route path="/" element={<Video1 />} />        */}
          </Routes>
        </BrowserRouter>

        <FloatButton
          style={{ right: 24, bottom: 24, color: 'white' }}
          onClick={handleButtonClick}
          shape="circle"
          icon={<MessageOutlined style={{ fontSize: '24px', color: defaultAppColor, display: 'flex', justifyContent: 'center', alignItems: 'center' }} />} // Centered message icon with app color
        />

        {showIcons && (
          <div style={{ position: 'fixed', bottom: 100, right: 24, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Tooltip title="WhatsApp">
              <a href="https://wa.me" target="_blank" rel="noopener noreferrer">
                <div className="icon-wrapper whatsapp" style={iconWrapperStyle}>
                  <WhatsAppOutlined style={{ ...iconStyle, color: 'white' }} /> {/* WhatsApp green */}
                </div>
              </a>
            </Tooltip>
            <Tooltip title="Facebook">
              <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer">
                <div className="icon-wrapper facebook" style={iconWrapperStyle}>
                  <FacebookOutlined style={{ ...iconStyle, color: 'white' }} /> {/* Facebook blue */}
                </div>
              </a>
            </Tooltip>
            <Tooltip title="Twiter">
              <a href="https://www.twiter.com" target="_blank" rel="noopener noreferrer">
                <div className="icon-wrapper x-app" style={iconWrapperStyle}>
                  <BiX style={{ ...iconStyle, color: 'white' }} /> {/* X icon */}
                </div>
              </a>
            </Tooltip>
            <Tooltip title="Telegram">
              <a href="https://telegram.org" target="_blank" rel="noopener noreferrer">
                <div className="icon-wrapper telegram" style={iconWrapperStyle}>
                  <BiLogoTelegram style={{ ...iconStyle, color: 'white' }} /> {/* Telegram icon */}
                </div>
              </a>
            </Tooltip>
            <Tooltip title="Instagram">
              <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer">
                <div className="icon-wrapper instagram" style={iconWrapperStyle}>
                  <InstagramOutlined style={{ ...iconStyle, color: 'white' }} /> {/* Instagram pink */}
                </div>
              </a>
            </Tooltip>
            <Tooltip title="LinkedIn">
              <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer">
                <div className="icon-wrapper linkedin" style={iconWrapperStyle}>
                  <LinkedinOutlined style={{ ...iconStyle, color: 'white' }} />
                </div>
              </a>
            </Tooltip>
          </div>
        )}
      </PersistGate>
    </Provider>
  );
};

const iconWrapperStyle = {
  padding: '8px',
  borderRadius: '50%',
  transition: 'background-color 0.3s',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};

const iconStyle = {
  fontSize: '32px',
};

const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
  .whatsapp:hover {
    background-color: #075e54; 
    color: white !important; 
  }
`, styleSheet.cssRules.length);

styleSheet.insertRule(`
  .facebook:hover {
    background-color: #316FF6;
  }
`, styleSheet.cssRules.length);

styleSheet.insertRule(`
  .x-app:hover {
    background-color: #000000;
  }
`, styleSheet.cssRules.length);

styleSheet.insertRule(`
  .telegram:hover {
    background-color: #0088cc;
  }
`, styleSheet.cssRules.length);

styleSheet.insertRule(`
  .instagram:hover {
    background: linear-gradient(45deg, #f9ce34, #ee2a7b, #6228d7);
  }
`, styleSheet.cssRules.length);

styleSheet.insertRule(`
  .linkedin:hover {
    background-color: ${defaultAppColor};
  }
`, styleSheet.cssRules.length);

export default App;
