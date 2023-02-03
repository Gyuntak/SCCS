import React, { useState, useCallback } from 'react'
import Editor from 'react-simple-code-editor'
// import Prism from 'prismjs';
import { highlight, languages } from 'prismjs/components/prism-core'
// import loadLanguages from 'prismjs/components/'

import "prismjs/components/prism-clike"; // 이거 없으면 자바 오류남
import 'prismjs/components/prism-python' // import 언어 모듈가서 확인 뒤 바꿔주기
import 'prismjs/components/prism-java' // 2개 import하면 오류뜸
import 'prismjs/themes/prism.css' //Example style, you can use another
import styled from 'styled-components'

const hightlightWithLineNumbers = (input, language) =>
  highlight(input, language)
    .split('\n')
    .map((line, i) => `<span class='editorLineNumber'>${i + 1}</span>${line}`)
    .join('\n')


    
export default function Textarea() {
  // loadLanguages(['pythnm', 'java']);

  // // The code snippet you want to highlight, as a string
  // const code = `= ['hi', 'there', 'reader!'].join " "`;

  // // Returns a highlighted HTML string
  // const html = Prism.highlight(code, Prism.languages.py, 'python');

  const [codeValue, setCodeValue] = useState('')

  const convertCode = useCallback(() => {
    let fileName = '';
    let output = "tggggggggg";
    const element = document.createElement('a');
    const file = new Blob([output], {
      type: 'text/plain',
    });
    element.href = URL.createObjectURL(file);
    element.download = fileName;
    document.body.appendChild(element); // FireFox
    element.click();
  },[])
  return (
    <StyledEditor
      value={codeValue}
      onValueChange={(code) => setCodeValue(code)}
      // highlight={(code) => hightlightWithLineNumbers(code, languages.py)} //languages 확장자 바꾸면 해당 언어로 바뀜
      highlight={(code) => hightlightWithLineNumbers(code, languages.java)} //languages 확장자 바꾸면 해당 언어로 바뀜
      padding={10}
      textareaId="codeArea"
      className="editor"
      style={{
        fontFamily: '"Fira code", "Fira Mono", monospace',
        fontSize: 14,
        outline: 0,
        
      }}
    />
  )
}

const StyledEditor = styled(Editor)`
  &.editor {
    counter-reset: line;
    border: 1px solid #ced4da;
    height: 100%;
    
  }

  &.editor #codeArea {
    outline: none;
    padding-left: 60px !important;
    
  }

  &.editor pre {
    padding-left: 60px !important;
  }

  &.editor .editorLineNumber {
    position: absolute;
    left: 0px;
    color: #D7ECFF;
    text-align: right;
    width: 40px;
    font-weight: 100;
  }
`
