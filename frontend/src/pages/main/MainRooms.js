import React, { useEffect, useState } from 'react'
import Button from 'components/common/Button'
import axios from 'libs/axios'
import api from 'constants/api'
import Room from 'components/main/Room'
import CheckDropdown from 'components/common/CheckDropdown'
import RadioDropdown from 'components/common/RadioDropdown'
import { algorithmPk, languagePk } from 'constants/pk'
import styled from 'styled-components'
import Modal from 'components/common/Modal'
import CreateModalContent from 'components/main/CreateModalContent'

const ex_rooms = [
  {
    id: 1,
    title: '커피내기',
    isSolving: true,
    isPrivate: true,
    algoIds: [1],
    languageIds: [1, 2],
  },
  {
    id: 2,
    title: '커피내기2',
    isSolving: false,
    isPrivate: false,
    algoIds: [1, 3],
    languageIds: [2],
  },
]

const searchOptions = {
  title: '방 이름',
  id: '방 번호',
}

export default function MainRooms() {
  const [rooms, setRooms] = useState(ex_rooms)
  const [algoIds, setAlgoIds] = useState([])
  const [languageIds, setLanguageIds] = useState([])
  const [selectedOption, setSelectedOption] = useState('title')
  const [query, setQuery] = useState('')
  const [showModal, setShowModal] = useState(false)

  // 전체 방 조회
  useEffect(() => {
    const [url, method] = api('searchRoom')
    const config = { url, method }
    axios(config)
      .then((res) => {
        setRooms(res.data)
      })
      .catch((err) => {
        console.log(err)
      })
  }, [])

  // 옵션변화로 인한 방 세부 조회
  useEffect(() => {
    const data = {
      algoIds,
      languageIds,
      title: '',
      id: 0,
    }
    const [url, method] = api('searchRoomDetail')
    const config = { url, method, data }
    console.log(data)
    axios(config)
      .then((res) => {
        console.log(res)
        setRooms(res.data)
      })
      .catch((err) => {
        console.log(err)
      })
  }, [algoIds, languageIds])

  // 검색버튼
  const searchRoom = () => {
    let data = {}
    if (selectedOption === 'title') {
      data = {
        algoIds,
        languageIds,
        title: query,
        id: 0,
      }
    }
    if (selectedOption === 'id') {
      data = {
        algoIds,
        languageIds,
        title: '',
        id: parseInt(query),
      }
    }
    const [url, method] = api('searchRoomDetail')
    const config = { url, method, data }
    console.log(data)
    axios(config)
      .then((res) => {
        console.log(res)
        setRooms(res.data)
      })
      .catch((err) => {
        console.log(err)
      })
  }

  // changeHandler
  const changeLanguageIds = (e) => {
    const id = parseInt(e.target.id.slice(0, 1))
    if (e.target.checked) {
      setLanguageIds([...languageIds, id])
      return
    }
    setLanguageIds(languageIds.filter((ele) => ele !== id))
  }

  const changeAlgoIds = (e) => {
    const id = parseInt(e.target.id.slice(0, 1))
    console.log(id)
    if (e.target.checked) {
      setAlgoIds([...algoIds, id])
      return
    }
    setAlgoIds(algoIds.filter((ele) => ele !== id))
  }

  return (
    <>
      {showModal && (
        <Modal
          close={() => setShowModal(false)}
          content={<CreateModalContent />}
        ></Modal>
      )}
      <FlexBox>
        <SearchContainer>
          <CheckDropdown
            title="언어선택"
            options={languagePk}
            onChange={changeLanguageIds}
          />
          <CheckDropdown
            title="알고리즘선택"
            options={algorithmPk}
            onChange={changeAlgoIds}
          />
          <InputBox>
            <RadioDropdown
              selectedId={selectedOption}
              name="검색옵션"
              options={searchOptions}
              onChange={(e) => setSelectedOption(e.target.id)}
            />
            <Input
              type={selectedOption === 'title' ? 'text' : 'number'}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            ></Input>
          </InputBox>
          <Button onClick={searchRoom} value="검색"></Button>
        </SearchContainer>
        <Button
          type="secondary"
          onClick={() => setShowModal(!showModal)}
          value="방 만들기"
        ></Button>
      </FlexBox>
      <GridBox>
        {rooms.map((room) => (
          <Room
            key={room.id}
            id={room.id}
            title={room.title}
            isSolving={room.isSolving}
            isPrivate={room.isPrivate}
            algoIds={room.algoIds}
            languageIds={room.languageIds}
          />
        ))}
      </GridBox>
    </>
  )
}

const FlexBox = styled.div`
  display: flex;
  justify-content: space-between;
`
const SearchContainer = styled.div`
  display: flex;
`
const InputBox = styled.div`
  display: flex;
  align-items: center;

  border: none;
  border-radius: 0.5rem;
  box-shadow: 3px 3px 7px #000000a0;

  background-color: white;
`

const Input = styled.input`
  border: none;
  border-radius: 0.5rem;
  color: black;
`

const GridBox = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem 1rem;

  margin: 2rem 2rem;
`
// const data = {
//   algoIds: [1, 2, 3, 4, 5, 6, 7],
//   languageIds: [1, 2],
//   title: '코테',
//   id: 0,
// }
// const data = {
//   algoIds: [1, 2, 3, 4, 5, 6, 7],
//   languageIds: [1, 2],
//   title: '',
//   id: 2,
// }
// const data = {
//   algoIds: [1, 2, 3],
//   languageIds: [1],
//   title: '',
//   id: 0,
// }
