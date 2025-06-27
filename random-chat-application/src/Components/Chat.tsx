import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';
import './Chat.css';
import Video1 from './Video1';
import { useLocation, useNavigate } from 'react-router-dom';
import { AudioOutlined, LoginOutlined, LogoutOutlined, SendOutlined, SmileOutlined } from '@ant-design/icons';
import { PhoneOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { Button, Popover, Select, Modal } from 'antd';
import './emoji-picker.css';
import { backend_url } from '../constants';

interface Message {
  username: string;
  msg?: string;
  audio?: string;
  recipient: string;
  type: 'text' | 'audio';
}



const emojiList = [
  { label: '😀', value: '😀' }, { label: '😁', value: '😁' }, { label: '😂', value: '😂' }, { label: '🤣', value: '🤣' },
  { label: '😃', value: '😃' }, { label: '😄', value: '😄' }, { label: '😅', value: '😅' }, { label: '😆', value: '😆' },
  { label: '😉', value: '😉' }, { label: '😊', value: '😊' }, { label: '😋', value: '😋' }, { label: '😎', value: '😎' },
  { label: '😍', value: '😍' }, { label: '😘', value: '😘' }, { label: '😗', value: '😗' }, { label: '😙', value: '😙' },
  { label: '😚', value: '😚' }, { label: '🙂', value: '🙂' }, { label: '🤗', value: '🤗' }, { label: '🤩', value: '🤩' },
  { label: '🤔', value: '🤔' }, { label: '🤨', value: '🤨' }, { label: '😐', value: '😐' }, { label: '😑', value: '😑' },
  { label: '😶', value: '😶' }, { label: '🙄', value: '🙄' }, { label: '😏', value: '😏' }, { label: '😣', value: '😣' },
  { label: '😥', value: '😥' }, { label: '😮', value: '😮' }, { label: '🤐', value: '🤐' }, { label: '😯', value: '😯' },
  { label: '😪', value: '😪' }, { label: '😫', value: '😫' }, { label: '🥱', value: '🥱' }, { label: '😴', value: '😴' },
  { label: '😌', value: '😌' }, { label: '😛', value: '😛' }, { label: '😜', value: '😜' }, { label: '😝', value: '😝' },
  { label: '🤤', value: '🤤' }, { label: '😒', value: '😒' }, { label: '😓', value: '😓' }, { label: '😔', value: '😔' },
  { label: '😕', value: '😕' }, { label: '🙃', value: '🙃' }, { label: '🤑', value: '🤑' }, { label: '😲', value: '😲' },
  { label: '☹️', value: '☹️' }, { label: '🙁', value: '🙁' }, { label: '😖', value: '😖' }, { label: '😞', value: '😞' },
  { label: '😟', value: '😟' }, { label: '😤', value: '😤' }, { label: '😢', value: '😢' }, { label: '😭', value: '😭' },
  { label: '😦', value: '😦' }, { label: '😧', value: '😧' }, { label: '😨', value: '😨' }, { label: '😩', value: '😩' },
  { label: '🤯', value: '🤯' }, { label: '😬', value: '😬' }, { label: '😰', value: '😰' }, { label: '😱', value: '😱' },
  { label: '🥵', value: '🥵' }, { label: '🥶', value: '🥶' }, { label: '😳', value: '😳' }, { label: '🤪', value: '🤪' },
  { label: '😵', value: '😵' }, { label: '🥴', value: '🥴' }, { label: '😠', value: '😠' }, { label: '😡', value: '😡' },
  { label: '🤬', value: '🤬' }, { label: '🤡', value: '🤡' }, { label: '🤥', value: '🤥' }, { label: '🤫', value: '🤫' },
  { label: '🤭', value: '🤭' }, { label: '🧐', value: '🧐' }, { label: '🤓', value: '🤓' }, { label: '😈', value: '😈' },
  { label: '👿', value: '👿' }, { label: '👹', value: '👹' }, { label: '👺', value: '👺' }, { label: '💀', value: '💀' },
  { label: '☠️', value: '☠️' }, { label: '👻', value: '👻' }, { label: '👽', value: '👽' }, { label: '👾', value: '👾' },
  { label: '🤖', value: '🤖' }, { label: '🎃', value: '🎃' }, { label: '😺', value: '😺' }, { label: '😸', value: '😸' },
  { label: '😹', value: '😹' }, { label: '😻', value: '😻' }, { label: '😼', value: '😼' }, { label: '😽', value: '😽' },
  { label: '🙀', value: '🙀' }, { label: '😿', value: '😿' }, { label: '😾', value: '😾' }
];


const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [msg, setMsg] = useState<string>('');
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const userData = useSelector((store: any) => store.user);
  const [partner, setPartner] = useState<string | null>(null);
  const [isChatStarted, setIsChatStarted] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const [isStopped, setIsStopped] = useState<boolean>(false);
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const socket = io(backend_url);
  const [callVisible, setCallVisible] = useState(false);
  const [videoCallVisible, setVideoCallVisible] = useState(false);
  const [call, setCall] = useState(false);

  useEffect(() => {
    if (!userData.email) {
      navigate('/');
      return;
    }

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      socket.emit('connect_user', { username: userData.email });
    });

    socket.on('chat_start', (data) => {
      if (data.partner) {
        setPartner(data.partner);
        setIsChatStarted(true);
        alert(`You are matched with: ${data.partner}`);
      }
    });

    socket.on('chat_message', (data: Message) => {
      console.log(data)
      setMessages((prev) => [...prev, data]);
      scrollToBottom();
    });

    socket.on('typing', (data) => {
      setTypingUser(data.username);
      clearTimeout(typingUserTimeout);
      typingUserTimeout = setTimeout(() => {
        setTypingUser(null);
      }, 500);
    });

    socket.on('user_left', () => {
      alert('Your chat partner has left the chat.');
      resetChat();
    });

    return () => {
      socket.off('connect');
      socket.off('chat_start');
      socket.off('chat_message');
      socket.off('typing');
      socket.off('user_left');
    };
  }, [userData.email, socket]);

  let typingUserTimeout: NodeJS.Timeout;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const resetChat = () => {
    setMessages([]);
    setMsg('');
    setTypingUser(null);
    setPartner(null);
    setIsChatStarted(false);
    setIsStopped(false);
    setSelectedEmoji(null);
  };

  const handleStopChat = () => {
    if (isStopped) {
      const confirmStop = window.confirm("Are you sure you want to stop the chat?");
      if (confirmStop) {
        socket.emit('leave_chat', { username: userData.email, partner });
        setIsStopped(true);
        setPartner(null);
        setIsChatStarted(false);
        alert('Chat has been stopped.');
      }
    } else {
      setIsStopped(true);
    }
  };

  const startChat = () => {
    if (userData.email) {
      socket.emit('start_chat', { username: userData.email });
    }
  };

  const sendMessage = () => {
    if (msg.trim() && isChatStarted && partner) {
      const messageData: Message = {
        username: userData.email,
        msg,
        recipient: partner,
        type: 'text',
      };
      socket.emit('chat_message', messageData);
      setMessages((prev) => [...prev, messageData]);
      setMsg('');
      scrollToBottom();
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      sendMessage();
    } else {
      socket.emit('typing', { username: userData.email, recipient: partner });
    }
  };

  const handleMicClick = () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
    } else {
      startRecording();
    }
  };

  const startRecording = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = () => {
            const base64Audio = reader.result as string;
            sendAudioMessage(base64Audio);
          };
          setIsRecording(false);
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (error) {
        console.error("Error accessing microphone:", error);
        alert("Could not access your microphone. Please check permissions.");
      }
    } else {
      alert("Your browser does not support audio recording.");
    }
  };

  const sendAudioMessage = (audioData: string) => {
    if (isChatStarted && partner) {
      const messageData: Message = {
        username: userData.email,
        msg: audioData,
        recipient: partner,
        type: 'audio',
      };
      socket.emit('chat_message', messageData);
      setMessages((prev) => [...prev, messageData]);
      scrollToBottom();
    }
  };

  const [open, setOpen] = useState(false);

  const hide = () => {
    setOpen(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
  };


  const handleEmojiSelect = (value: string) => {
    setMsg((prev) => prev + value);
    hide();
  };



  const handleKeyDown = (event: KeyboardEvent) => {
    // Check for Ctrl + R or Cmd + R (on Mac)
    if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
      event.preventDefault(); // Prevent the default refresh action
      const confirmRefresh = window.confirm("Are you sure you want to refresh the page?");
      if (confirmRefresh) {
        window.location.reload(); // Manually refresh if the user confirms
      }
    }
  };

  useEffect(() => {
    // Add event listener for keydown
    window.addEventListener('keydown', handleKeyDown);

    // Clean up the event listener on component unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const [isLoggedIn, setIsLoggedIn] = useState(true); // Hook should be here

  const handleLogout = () => {
    if (isLoggedIn) {
      setIsLoggedIn(false); // Update logged-in state
      navigate('/'); // Redirect to login page
    } else {
      alert('Illegal activity detected'); // Alert for illegal access
    }
  };


  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isChatStarted && !isStopped) {
        event.preventDefault();
        event.returnValue = ''; // Required for Chrome to show the confirmation dialog
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isChatStarted, isStopped]);

  // Handle in-app navigation
  useEffect(() => {
    const handleNavigation = (event: BeforeUnloadEvent) => {
      if (isChatStarted && !isStopped) {
        const confirmLeave = window.confirm('Are you sure you want to leave the chat?');
        if (!confirmLeave) {
          event.preventDefault();
          return; // Prevent navigation
        }
      }
    };

    window.addEventListener('beforeunload', handleNavigation);

    return () => {
      window.removeEventListener('beforeunload', handleNavigation);
    };
  }, [isChatStarted, isStopped]);



  return (
    <>
      <header>
        <nav className="navbar1">
          <h2 className="navbar-title1"><u>Chat Application</u></h2>
          {/* <input type="text" className="search-box1" placeholder="Search..." /> */}
          <button style={{ marginRight: '20px' }} onClick={handleLogout}><LogoutOutlined />Logout</button>
        </nav>
      </header>

      {/* <div className="decorative-dot1 dot-orange1"></div>
        <div className="decorative-dot1 dot-blue1"></div>
        <div className="decorative-dot1 dot-purple1"></div>
        <div className="decorative-dot1 dot-green1"></div> */}

      <div className="chat-container1">
        <h2 className="chat-header1"><u>Chat Room {partner ? `with ${partner}` : ''}</u></h2>
        <Video1 socket={socket} user={userData.email} partner={partner} call={call} videoCallVisible={videoCallVisible} setVideoCallVisible={setVideoCallVisible} />

        {!isChatStarted ? (
          <button className="start-chat-button1" onClick={startChat}>New Chat</button>
        ) : (
          <>
            <div className="message-container1">
              <div
                className="header"
                style={{
                  position: 'sticky',
                  top: '-30px',
                  left: 0,
                  width: '95%',
                  backgroundColor: 'transparent',
                  border: '1px solid white',
                  padding: '10px 15px',
                  display: 'flex',
                  backdropFilter: 'blur(10px)',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  zIndex: 1000,
                  boxShadow: '0px 4px 6px rgba(0,0,0,0.1)',
                }}
              >
                <span style={{ fontWeight: 'bold', fontSize: '18px' }}><u>{partner}</u></span>
                <div style={{ display: 'flex', gap: '15px' }}>
                  {/* Call Icon */}
                 
                  {/* Video Call Icon */}
                  <VideoCameraOutlined
                    onClick={() => {
                      setVideoCallVisible(true)
                      setCall(true)
                    }}
                    style={{
                      fontSize: '24px',
                      cursor: 'pointer',
                      color: 'white',
                      paddingRight: '20px',
                    }}
                  />
                </div>
              </div>

              {callVisible && (
                <div className="call-modal"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: '#fff',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    padding: '20px',
                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 1000,
                    width: '300px',
                  }}
                >
                  <h3>Call with {partner}</h3>
                  <div style={{
                    display: 'flex', // Display buttons in a row
                    justifyContent: 'space-between', // Space between buttons
                    width: '100%',
                  }}>
                    <Button
                      style={{
                        backgroundColor: 'green', // Green background for Start Call
                        color: '#fff', // White text color
                        border: 'none', // No border
                        borderRadius: '5px', // Rounded corners
                        padding: '10px 15px', // Padding for the button
                        cursor: 'pointer', // Pointer cursor on hover
                        flex: '1', // Allow button to grow and take available space
                        marginRight: '5px',
                      }}
                    >
                      Start Call
                    </Button>

                    <Button
                      onClick={() => setCallVisible(false)}  // Close the modal when clicked
                      style={{
                        backgroundColor: 'grey', // Grey background for Close button
                        color: '#fff', // White text color
                        border: 'none', // No border
                        borderRadius: '5px', // Rounded corners
                        padding: '10px 15px', // Padding for the button
                        cursor: 'pointer', // Pointer cursor on hover
                        flex: '1',
                      }}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              )}



              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`message1 ${message.username === userData.email ? 'sent1' : 'received1'
                    }`}
                >
                  {index === 0 || messages[index - 1].username !== message.username ? (
                    <div className="username1">{message.username.toLowerCase()}</div>
                  ) : null}
                  {message.type === 'text' ? (
                    <div className="msg1">{message.msg}</div>
                  ) : message.type === 'audio' ? (
                    <audio
                      controls
                      src={message.msg}
                      className="audio-message"
                      style={{
                        width: window.innerWidth <= 800 ? '100%' : '300px',
                        maxWidth: '100%',
                      }}
                    ></audio>
                  ) : null}
                </div>
              ))}
              <div ref={messagesEndRef} />
              {typingUser && (
                <div className="typing-indicator1">{typingUser} is typing...</div>
              )}
            </div>


            <div className="input-container1">
              <button className={`stop-button1 ${isStopped ? 'active' : ''}`} onClick={handleStopChat}>
                {isStopped ? 'Confirm Stop' : 'Stop Chat'}
              </button>
              <div className="input-wrapper" style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  value={msg} // This should bind to the msg state
                  onChange={(e) => setMsg(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="message-input1" // Custom class for styling
                />

                <Popover
                  content={
                    <div style={{
                      width: '500px',
                      height: '500px',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(5, 1fr)',
                      gridAutoRows: 'minmax(80px, auto)',
                      gap: '10px',
                      overflowY: 'auto',
                      padding: '10px',
                      backgroundColor: '#ffffff',
                    }}>
                      {emojiList.map((emoji) => (
                        <div
                          key={emoji.value}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: '32px',
                            borderRadius: '8px',
                            transition: 'background-color 0.2s',
                          }}
                          onClick={() => handleEmojiSelect(emoji.label)} // Use emoji.label to append
                          onMouseOver={(e) => {
                            (e.currentTarget as HTMLDivElement).style.backgroundColor = '#f0f0f0';
                          }}
                          onMouseOut={(e) => {
                            (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
                          }}
                        >
                          {emoji.label}
                        </div>
                      ))}
                    </div>
                  }
                  title="Pick an Emoji"
                  trigger="click"
                  open={open}
                  onOpenChange={handleOpenChange}
                >
                  <span
                    className="smiley-icon"
                    style={{ fontSize: '32px', color: 'white', cursor: 'pointer', marginRight: '8px' }}
                    title="Pick an Emoji"
                  >
                    <SmileOutlined style={{ fontSize: '32px', color: 'white' }} />
                  </span>
                </Popover>
                <span
                  className="mic-icon"
                  onClick={handleMicClick}
                  style={{ fontSize: '24px', cursor: 'pointer', color: isRecording ? 'red' : 'white', fontWeight: 'bold' }}
                  title={isRecording ? "Stop Recording" : "Start Recording"}

                >

                  <AudioOutlined />

                </span>

                <span
                  className="send-button1"
                  onClick={sendMessage}
                  style={{ cursor: 'pointer', marginLeft: '8px' }}
                  title="Send Message"
                >
                  <SendOutlined />
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default Chat;
