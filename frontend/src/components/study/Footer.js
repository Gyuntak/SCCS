import React, { useCallback } from 'react'
import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'
import Button from 'components/common/Button'

export default function Footer() {
  const navigate = useNavigate()

  // const convertCode = useCallback(() => {
  //   let fileName = '';
  //   let output = "tggggggggg";
  //   const element = document.createElement('a');
  //   const file = new Blob([output], {
  //     type: 'text/plain',
  //   });
  //   element.href = URL.createObjectURL(file);
  //   element.download = fileName;
  //   document.body.appendChild(element); // FireFox
  //   element.click();
  // },[])

  return (
    <Foot>
      <EndBtn>
        <Button
          value="시험 종료"
          type='danger'
          size="small"
          // onClick={() => {
          //   convertCode('')
          // }}
        ></Button>
      </EndBtn>
      <CompileBtn>
        <Button
          value="테스트"
          type='gray'
          size="small"
          margin-right='5px'
          onClick={() => {
            navigate('/mypage/profile/edit')            
          }}
        ></Button>
        <Space></Space>
        <Button
        value="제출"
        size="small"
        onClick={() => {
          navigate('/auth/login')
        }}
        ></Button>
      </CompileBtn>
    </Foot>
  )
}

const Foot = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin: 0rem 0rem;
  padding: 0rem 1rem;
`

const EndBtn = styled.div`
  display: flex;  
`

const CompileBtn = styled.div`
  display: flex;
  justify-content: space-between;
  margin-left: 1rem;
`
const Space = styled.div`
  width: 1.5rem;
  height: auto;
  display: inline-block;
` 
