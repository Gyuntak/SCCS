import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, Outlet, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import axios from 'libs/axios'
import api from 'constants/api'
import styled from 'styled-components'
import sockjs from 'sockjs-client'
import stompjs from 'stompjs'
import Loading from 'components/common/Loading'
import ToolBar from 'components/study/ToolBar'

import { toggleTheme } from 'redux/themeSlice'

import { OpenVidu, VideoInsertMode } from 'openvidu-browser'
import axiosOriginal from 'axios'
import VideoComponent from '../../components/study/VideoComponent'
import * as faceapi from 'face-api.js'
import presentImg from 'assets/img/webRTC_present_image.png'
import absentImg from 'assets/img/webRTC_absent_image.png'

//Openvidu AppServer
const APPLICATION_SERVER_URL = 'https://i8a301.p.ssafy.io/'
// const APPLICATION_SERVER_URL = 'http://localhost:5000/'

export default function StudyRoom() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const location = useLocation()

  console.log(location)

  const theme = useSelector((state) => state.theme)

  // 기본정보
  const user = useSelector((state) => state.user)
  const { studyroomId } = useParams()
  const [roomInfo, setRoomInfo] = useState(null)
  const [members, setMembers] = useState([])
  const [problems, setProblems] = useState(null)

  // 웹소켓 useState
  const [stomp, setStomp] = useState(null)
  const [connected, setConnected] = useState(false)

  // 채팅 useState
  const [message, setMessage] = useState('')
  const [chatList, setChatList] = useState([])

  // 스터디룸 정보 axios 요청
  useEffect(() => {
    const [url, method] = api('enterRoom', { studyroomId })
    const config = { url, method }
    axios
      .request(config)
      .then((res) => {
        const roomInfo = res.data
        setRoomInfo(roomInfo)
      })
      .catch((err) => {
        alert('대기방 정보를 불러오지 못했습니다.')
      })
  }, [])

  // mount시에 소켓통신 연결, unmount 시 소켓통신 해제
  useEffect(() => {
    joinSession()
    connect()
    return () => {
      exit()
    }
  }, [])

  // 새로고침 시
  window.addEventListener('beforeunload', (event) => {
    // 명세에 따라 preventDefault는 호출해야하며, 기본 동작을 방지합니다.
    event.preventDefault()
    exit()
  })

  // 브라우저창 닫을 시
  window.addEventListener('unload', (event) => {
    // 명세에 따라 preventDefault는 호출해야하며, 기본 동작을 방지합니다.
    event.preventDefault()
    exit()
  })

  const exit = () => {
    if (stomp) {
      sendExit()
      stomp.disconnect()
    }

    if (session) {
      session.disconnect()
    }

    setConnected(false)
    // Empty all properties...
    OV.current = null
    setSession(undefined)
    setSubscribers([])
    setMainStreamManager(undefined)
    setPublisher(undefined)

    navigate('/')
  }

  // 소켓 통신 여는 함수
  const connect = () => {
    const sock = new sockjs('https://sccs.kr/sccs')
    const stomp = stompjs.over(sock)
    setStomp(stomp)
    stomp.connect({}, () => {
      setConnected(true)
      stomp.send(
        '/pub/studyroom',
        {},
        JSON.stringify({
          status: 'enter',
          studyroomId: studyroomId,
          nickname: user.nickname,
        }),
      )
      stomp.subscribe('/sub/studyroom/' + studyroomId, (chatDto) => {
        const content = JSON.parse(chatDto.body)
        if (content.status === 'enter') {
          setRoomInfo((roomInfo) => {
            const newRoomInfo = { ...roomInfo }
            newRoomInfo.personnel = content.personnel
            return newRoomInfo
          })
          return
        }
        if (content.status === 'exit') {
          setRoomInfo((roomInfo) => {
            const newRoomInfo = { ...roomInfo }
            newRoomInfo.personnel = content.personnel
            return newRoomInfo
          })
          return
        }
        if (content.status === 'chat') {
          const { nickname, profileImage, message } = content
          setChatList((chatList) => [
            { nickname, profileImage, message },
            ...chatList,
          ])
          return
        }
      })
    })
  }

  // 소켓 통신 닫는 함수
  const disconnect = () => {
    sendExit()
    stomp.disconnect()
    setConnected(false)
    navigate('/')
  }

  // 웹 소켓 send: 방 나가기
  const sendExit = () => {
    stomp.send(
      '/pub/studyroom',
      {},
      JSON.stringify({
        status: 'exit',
        studyroomId: studyroomId,
        nickname: user.nickname,
      }),
    )
  }

  // 웹 소켓 send: 채팅 전송
  const sendChat = () => {
    stomp.send(
      '/pub/studyroom',
      {},
      JSON.stringify({
        status: 'chat',
        studyroomId: studyroomId,
        nickname: user.nickname,
        profileImage: user.profileImage,
        message: message,
      }),
    )
    setMessage('')
  }

  ////////////////////////////Open Vidu////////////////////////////
  const [session, setSession] = useState(undefined)
  const [mainStreamManager, setMainStreamManager] = useState(undefined)
  const [publisher, setPublisher] = useState(undefined)
  const [subscribers, setSubscribers] = useState([])
  const [currentVideoDevice, setCurrentVideoDevice] = useState(undefined)
  const OV = useRef(null)

  const [isMicOn, setIsMicOn] = useState(true)
  const [isScreen, setIsScreen] = useState(false)
  const [isCameraOn, setIsCameraOn] = useState(true)

  const handleMainVideoStream = (stream) => {
    if (mainStreamManager === stream) return
    setMainStreamManager(stream)
  }

  const deleteSubscriber = (streamManager) => {
    // 진짜 이유는 모르겠는데 newSubscribers = [...subscribers] 로 불러오면 안됨!!! 모두 처리해준 다음에 마지막 대입 전에 전개
    const newSubscribers = subscribers
    let index = newSubscribers.indexOf(streamManager, 0)
    if (index > -1) {
      newSubscribers.splice(index, 1)
      setSubscribers([...newSubscribers])
    }
  }

  // OpenVidu Session에 Join하는 함수
  const joinSession = () => {
    // --- 1) Get an OpenVidu object ---

    OV.current = new OpenVidu()

    // --- 2) Init a session ---

    setSession(OV.current.initSession())
  }

  // OpenVidu 비디오를 스트리밍 하는 함수
  useEffect(() => {
    if (!session) return

    // --- 3) Specify the actions when events take place in the session ---

    // On every new Stream received...
    session.on('streamCreated', (event) => {
      // Subscribe to the Stream to receive it. Second parameter is undefined
      // so OpenVidu doesn't create an HTML video by its own
      // 진짜 이유는 모르겠는데 newSubscribers = [...subscribers] 로 불러오면 안됨!!! 모두 처리해준 다음에 마지막 대입 전에 전개
      const subscriber = session.subscribe(event.stream, undefined)
      const newSubscribers = subscribers
      newSubscribers.push(subscriber)

      // Update the state with the new subscribers
      setSubscribers([...newSubscribers])
    })

    // On every Stream destroyed...
    session.on('streamDestroyed', (event) => {
      // Remove the stream from 'subscribers' array
      deleteSubscriber(event.stream.streamManager)
    })

    // On every asynchronous exception...
    session.on('exception', (exception) => {
      console.warn(exception)
    })

    // --- 4) Connect to the session with a valid user token ---

    // Get a token from the OpenVidu deployment
    getToken().then((token) => {
      console.log('token', token)
      // First param is the token got from the OpenVidu deployment. Second param can be retrieved by every user on event
      // 'streamCreated' (property Stream.connection.data), and will be appended to DOM as the user's nickname
      session
        .connect(token, { clientData: user.nickname })
        .then(async () => {
          // --- 5) Get your own camera stream ---

          // Init a publisher passing undefined as targetElement (we don't want OpenVidu to insert a video
          // element: we will manage it on our own) and with the desired properties
          const publisher = await OV.current.initPublisherAsync(undefined, {
            audioSource: undefined, // The source of audio. If undefined default microphone
            videoSource: undefined, // The source of video. If undefined default webcam
            publishAudio: true, // Whether you want to start publishing with your audio unmuted or not
            publishVideo: true, // Whether you want to start publishing with your video enabled or not
            resolution: '640x480', // The resolution of your video
            frameRate: 30, // The frame rate of your video
            insertMode: 'APPEND', // How the video is inserted in the target element 'video-container'
            mirror: false, // Whether to mirror your local video or not
          })
          // --- 6) Publish your stream ---

          session.publish(publisher)

          // Obtain the current video device in use
          const devices = await OV.current.getDevices()
          const videoDevices = devices.filter(
            (device) => device.kind === 'videoinput',
          )
          const currentVideoDeviceId = publisher.stream
            .getMediaStream()
            .getVideoTracks()[0]
            .getSettings().deviceId
          const currentVideoDevice = videoDevices.find(
            (device) => device.deviceId === currentVideoDeviceId,
          )

          // Set the main video in the page to display our webcam and store our Publisher
          setCurrentVideoDevice(currentVideoDevice)
          setMainStreamManager(publisher)
          setPublisher(publisher)
        })
        .catch((error) => {
          console.log(
            'There was an error connecting to the session:',
            error.code,
            error.message,
          )
        })
    })
  }, [session])

  // OpenVidu Session을 떠나는 함수
  const leaveSession = () => {
    // --- 7) Leave the session by calling 'disconnect' method over the Session object ---
    if (session) {
      session.disconnect()
    }

    // Empty all properties...
    OV.current = null
    setSession(undefined)
    setSubscribers([])
    setMainStreamManager(undefined)
    setPublisher(undefined)
  }

  // 카메라 상태를 토글하는 함수(화면 <-> 얼굴인식)
  const toggleCamera = async () => {
    // 카메라가 꺼진 상태였을 경우, 원래 화면으로
    if (!isCameraOn) {
      const video = document.getElementById('publisher-video')
      video.srcObject = undefined
      const devices = await OV.current.getDevices()
      // videoDevice 배열 추출
      const videoDevices = devices.filter(
        (device) => device.kind === 'videoinput',
      )
      const newPublisher = OV.current.initPublisher(undefined, {
        videoSource: videoDevices[0].deviceId,
        publishAudio: true,
        publishVideo: true,
        mirror: false,
      })

      await session.unpublish(mainStreamManager)
      await session.publish(newPublisher)

      setMainStreamManager(newPublisher)
      setPublisher(newPublisher)
      setIsCameraOn(!isCameraOn)
      return
    }

    // 카메라가 켜진 상태였을 경우, 얼굴인식 화면으로
    const MODEL_URL = process.env.PUBLIC_URL + '/models'
    const video = document.getElementById('publisher-video')

    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      // faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      // faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      // faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
    ]).then(startVideo)

    function startVideo() {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          console.log('start video')
          video.srcObject = stream
        })
        .catch((err) => {
          console.log('error')
          console.log(err)
        })
    }

    video.addEventListener('play', () => {
      console.log('play')
      const canvas = faceapi.createCanvasFromMedia(video)
      const track = canvas.captureStream(10).getVideoTracks()[0]
      publisher.replaceTrack(track)

      const displaySize = { width: video.width, height: video.height }
      faceapi.matchDimensions(canvas, displaySize)

      // 이미지 선언
      const img = document.createElement('img')
      img.style.objectFit = 'contain'
      img.width = 30
      img.height = 20

      setInterval(async () => {
        const detections = await faceapi.detectSingleFace(
          video,
          new faceapi.TinyFaceDetectorOptions(),
        )
        // .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        // .withFaceLandmarks()
        // .withFaceExpressions()
        // const resizedDetections = faceapi.resizeResults(detections, displaySize)
        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        if (detections) {
          img.src = presentImg
          ctx.drawImage(img, 0, 0)
        } else {
          img.src = absentImg
          ctx.drawImage(img, 0, 0)
        }
        // faceapi.draw.drawDetections(canvas, resizedDetections)
        // faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
        // faceapi.draw.drawFaceExpressions(canvas, resizedDetections)
      }, 100)

      setIsCameraOn(!isCameraOn)
    })
  }

  // 마이크 상태를 토글하는 함수
  const toggleMic = () => {
    publisher.publishAudio(!isMicOn) // true to unmute the audio track, false to mute it
    setIsMicOn(!isMicOn)
  }

  /**
   * --------------------------------------------
   * GETTING A TOKEN FROM YOUR APPLICATION SERVER
   * --------------------------------------------
   * The methods below request the creation of a Session and a Token to
   * your application server. This keeps your OpenVidu deployment secure.
   *
   * In this sample code, there is no user control at all. Anybody could
   * access your application server endpoints! In a real production
   * environment, your application server must identify the user to allow
   * access to the endpoints.
   *
   * Visit https://docs.openvidu.io/en/stable/application-server to learn
   * more about the integration of OpenVidu in your application server.
   */
  const getToken = async () => {
    const sessionId = await createSession(studyroomId) // 스터디룸의 pk값과 동일하게
    return await createToken(sessionId)
  }

  const createSession = async (sessionId) => {
    // console.log('Join Session', APPLICATION_SERVER_URL)
    const response = await axiosOriginal.post(
      APPLICATION_SERVER_URL + 'openvidu/sessions',
      { customSessionId: sessionId },
      {
        headers: { 'Content-Type': 'application/json' },
      },
    )
    return response.data // The sessionId
  }

  const createToken = async (sessionId) => {
    const response = await axiosOriginal.post(
      APPLICATION_SERVER_URL +
        'openvidu/sessions/' +
        sessionId +
        '/connections',
      {},
      {
        headers: { 'Content-Type': 'application/json' },
      },
    )
    return response.data // The token
  }
  /////////////////////////////////////////////////////////////////

  console.log(location.pathname.slice(-4))
  return (
    <Container>
      {connected ? (
        <>
          <Outlet
            context={{
              user,
              studyroomId,
              roomInfo,
              stomp,
              connected,
              members,
              setMembers,
              problems,
              setProblems,
              message,
              setMessage,
              chatList,
              sendChat,
              disconnect,
            }}
          />

          {location.pathname.slice(-4) !== 'test' && (
            <VideoContainer>
              {publisher && (
                <div
                  className="stream-container"
                  onClick={() => handleMainVideoStream(publisher)}
                >
                  <VideoComponent streamManager={publisher} />
                </div>
              )}
              {subscribers.map((sub, i) => (
                <div
                  key={`${sub.id}-${i}`}
                  className="stream-container"
                  onClick={() => handleMainVideoStream(sub)}
                >
                  <VideoComponent streamManager={sub} />
                </div>
              ))}
            </VideoContainer>
          )}
        </>
      ) : (
        <Loading height="30rem" />
      )}
      <ToolBar
        toggleCamera={toggleCamera}
        toggleMic={toggleMic}
        isCameraOn={isCameraOn}
        isMicOn={isMicOn}
        exit={exit}
        theme={theme}
        toggleTheme={() => dispatch(toggleTheme())}
      />
    </Container>
  )
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  width: 100vw;
  height: 100vh;
  background-color: ${({ theme }) => theme.studyBaseBgColor};
`
const VideoContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 5px;
`

// // 웹소켓 subscribe
// useEffect(() => {
//   if (!connected) return
//   const subscription = stomp.subscribe(
//     '/sub/studyroom/' + studyroomId,
//     (chatDto) => {
//       const content = JSON.parse(chatDto.body)
//       if (content.status === 'enter') {
//         setRoomInfo((roomInfo) => {
//           const newRoomInfo = { ...roomInfo }
//           newRoomInfo.personnel = content.personnel
//           return newRoomInfo
//         })
//         return
//       }
//       if (content.status === 'exit') {
//         setRoomInfo((roomInfo) => {
//           const newRoomInfo = { ...roomInfo }
//           newRoomInfo.personnel = content.personnel
//           return newRoomInfo
//         })
//         return
//       }
//       if (content.status === 'chat') {
//         const { nickname, profileImage, message } = content
//         setChatList((chatList) => [
//           ...chatList,
//           { nickname, profileImage, message },
//         ])
//       }
//     },
//   )
//   return () => {
//     subscription.unsubscribe()
//   }
// }, [connected, roomInfo, chatList])