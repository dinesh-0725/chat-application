import { useEffect, useRef, useState } from "react";
import Peer from "simple-peer";
import { Button } from 'antd';
import { PhoneOutlined } from '@ant-design/icons';
import React from "react";

function Video1({ socket, user, partner, videoCallVisible, setVideoCallVisible, call }: any) {
    const [me, setMe] = useState<string>("");
    const [stream, setStream] = useState<MediaStream | undefined>(undefined);
    const [receivingCall, setReceivingCall] = useState(false);
    const [caller, setCaller] = useState<string>("");
    const [callerSignal, setCallerSignal] = useState<any>();
    const [callAccepted, setCallAccepted] = useState(false);
    const [callEnded, setCallEnded] = useState(false);
    const [isRinging, setIsRinging] = useState(false);
    const myVideo = useRef<HTMLVideoElement | null>(null);
    const userVideo = useRef<HTMLVideoElement | null>(null);
    const connectionRef = useRef<Peer | null>(null);
    const [videoEnabled, setVideoEnabled] = useState(true);
    const [audioEnabled, setAudioEnabled] = useState(true);

    // Get media stream (audio/video)
    useEffect(() => {
        const getMedia = async () => {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setStream(mediaStream);
                if (myVideo.current) {
                    myVideo.current.srcObject = mediaStream;
                }
            } catch (err) {
                console.error("Error accessing media devices.", err);
            }
        };

        getMedia();

        // Socket listeners
        socket.on("callUser", (data: { from: string, name: any, signal: any }) => {
            setReceivingCall(true);
            console.log(data);
            setCaller(data.from);
            setCallerSignal(data.signal);
        });

        socket.on("missedCall", (data: { from: string, to: string, name: string }) => {
            console.log(`${data.name} missed your call.`);
        });

        return () => {
            socket.off("callUser");
            socket.off("missedCall");
        };
    }, [socket]);

    // Call user when "call" is passed as a prop
    useEffect(() => {
        if (call) {
            callUser();
        }
    }, [call]);

    const callUser = () => {
        try {
            const peer = new Peer({
                initiator: true,
                trickle: false,
                stream: stream,
            });

            peer.on("signal", (data: any) => {
                setIsRinging(true);
                socket.emit("callUser", {
                    userToCall: partner,
                    signalData: data,
                    from: user,
                    name: user,
                });
            });

            peer.on("stream", (incomingStream: MediaStream) => {
                if (userVideo.current) {
                    userVideo.current.srcObject = incomingStream;
                }
            });

            socket.on("callAccepted", (signal: any) => {
                setCallAccepted(true);
                setIsRinging(false);
                peer.signal(signal);
            });

            connectionRef.current = peer;
        } catch (err) {
            console.error("Error during the call:", err);
            connectionRef.current = null;
        }
    };

    const answerCall = () => {
        setCallAccepted(true);
        setIsRinging(false);
        setVideoCallVisible(true);
        try {
            const peer = new Peer({
                initiator: false,
                trickle: false,
                stream: stream,
            });

            peer.on("signal", (data: any) => {
                socket.emit("answerCall", { signal: data, to: caller });
            });

            peer.on("stream", (incomingStream: MediaStream) => {
                if (userVideo.current) {
                    userVideo.current.srcObject = incomingStream;
                }
            });

            peer.signal(callerSignal);
            connectionRef.current = peer;
        } catch (err) {
            console.error("Error answering the call:", err);
            connectionRef.current = null;
        }
    };

    const declineCall = () => {
        setReceivingCall(false);
        setIsRinging(false);
        setVideoCallVisible(false);
        socket.emit("missedCall", { from: user, to: caller, name: user });
    };

    const leaveCall = () => {
        setCallEnded(true);
        if (connectionRef.current) {
            connectionRef.current.destroy();
            connectionRef.current = null;
        }
    };

    const toggleVideo = () => {
        if (stream) {
            const videoTrack = stream.getVideoTracks()[0];
            videoTrack.enabled = !videoTrack.enabled;
            setVideoEnabled(videoTrack.enabled);
        }
    };

    const toggleAudio = () => {
        if (stream) {
            const audioTrack = stream.getAudioTracks()[0];
            audioTrack.enabled = !audioTrack.enabled;
            setAudioEnabled(audioTrack.enabled);
        }
    };

    return (
        <div className="video-call-container">
            {videoCallVisible && (
                <>
                    {/* Video elements */}
                    <div className="video-section">
                        {stream && <video playsInline muted ref={myVideo} autoPlay />}
                        {callAccepted && !callEnded && <video playsInline ref={userVideo} autoPlay />}
                    </div>
                    {/* Controls */}
                    <div className="controls">
                        <Button onClick={toggleVideo}>{videoEnabled ? "Disable Video" : "Enable Video"}</Button>
                        <Button onClick={toggleAudio}>{audioEnabled ? "Mute Audio" : "Unmute Audio"}</Button>
                    </div>
                </>
            )}
            {/* Call buttons */}
            {receivingCall && !callAccepted && (
                <div className="incoming-call-popup">
                    <h1>{partner} is calling...</h1>
                    <Button onClick={answerCall} style={{ backgroundColor: 'green', color: 'white' }}>Answer</Button>
                    <Button onClick={declineCall} style={{ backgroundColor: 'red', color: 'white' }}>Decline</Button>
                </div>
            )}
            {isRinging && !callAccepted && (
                <div className="ringing-popup">
                    <h1>Ringing...</h1>
                    <p>Calling {partner}</p>
                    <PhoneOutlined onClick={declineCall} style={{ fontSize: '40px', color: 'red' }} />
                </div>
            )}
        </div>
    );
}

export default Video1;
