import React, { useContext, useState, useEffect } from 'react'
import EditorContainer from './EditorContainer'
import {InputConsole, OutputConsole} from './Console'
import Navbar from './Navbar'
import styled from 'styled-components'
import { useParams } from 'react-router-dom'
import { languageMap, PlaygroundContext } from '../context/PlaygroundContext'
import { ModalContext } from '../context/ModalContext'
import Modal from '../ModalTypes/ModalStyling'
import { Buffer } from 'buffer'
import axios from 'axios'
const MainContainer = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  min-height: calc(100vh - 4.5rem);
  @media (max-width: 768px){
    grid-template-columns: 1fr;
  }
`
const Consoles = styled.div`
  display: grid;
  width: 100%;
  grid-template-rows: 1fr 1fr;
  grid-template-columns: 1fr;
`
export const Playground = () => {
  const { folderId: paramFolderId, playgroundId: paramPlaygroundId } = useParams();

  const { folders, savePlayground } = useContext(PlaygroundContext);
  const { isOpenModal, openModal, closeModal } = useContext(ModalContext);

  const [folderId] = useState(() => localStorage.getItem("currentFolderId") || paramFolderId);
  const [playgroundId] = useState(() => localStorage.getItem("currentPlaygroundId") || paramPlaygroundId);

  useEffect(() => {
    localStorage.setItem("currentFolderId", folderId);
    localStorage.setItem("currentPlaygroundId", playgroundId);
  }, [folderId, playgroundId]);

  const { title, language, code } = folders[folderId]?.playgrounds[playgroundId] || {};

  const folder = folders[folderId] || {};
  const playground = folder?.playgrounds?.[playgroundId] || {};

  const [currentLanguage, setCurrentLanguage] = useState(playground.language || '');
  const [currentCode, setCurrentCode] = useState(playground.code || '');
  const [currentInput, setCurrentInput] = useState('');
  const [currentOutput, setCurrentOutput] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    setCurrentLanguage(playground.language || '');
    setCurrentCode(playground.code || '');
  }, [playground]);
 
  const saveCode = () => {
    savePlayground(folder._id, playground._id, currentCode, currentLanguage)
    console.log("Playground:", playground);
  }

  const encode = (str) => {
    return Buffer.from(str, "binary").toString("base64")
  }

  const decode = (str) => {
    return Buffer.from(str, 'base64').toString()
  }

  const postSubmission = async (language_id, source_code, stdin) => {
    const options = {
      method: 'POST',
      url: 'https://judge0-ce.p.rapidapi.com/submissions',
      params: { base64_encoded: 'true', fields: '*' },
      headers: {
        'content-type': 'application/json',
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': 'b4e5c5a05fmsh9adf6ec091523f8p165338jsncc58f31c26e1',
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
      },
      data: JSON.stringify({
        language_id: language_id,
        source_code: source_code,
        stdin: stdin
      })
    };

    const res = await axios.request(options);
    return res.data.token
  }


  const getOutput = async (token) => {
    try {
      const options = {
        method: 'GET',
        url: `https://judge0-ce.p.rapidapi.com/submissions/${token}`,
        params: { base64_encoded: 'true', fields: '*' },
        headers: {
          'X-RapidAPI-Key': '3ed7a75b44mshc9e28568fe0317bp17b5b2jsn6d89943165d8',
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
        }
      };
  
      const res = await axios.request(options);
  
      if (!res || !res.data) {
        throw new Error("No response data available");
      }
  
      if (res.data.status_id <= 2) {
        const res2 = await getOutput(token);
        return res2; 
      }
  
      return res.data;
    } catch (error) {
      console.error("Error fetching output:", error);
      return { status: { description: "Error" }, stdout: "", compile_output: "", stderr: error.message };
    }
  };

  const runCode = async () => {
    openModal({
      show: true,
      modalType: 5,
      identifiers: {
        folderId: "",
        cardId: "",
      }
    })
    const language_id = languageMap[currentLanguage].id;
    const source_code = encode(currentCode);
    const stdin = encode(currentInput);

    const token = await postSubmission(language_id, source_code, stdin);

    const res = await getOutput(token);
    const status_name = res.status.description;
    const decoded_output = decode(res.stdout ? res.stdout : '');
    const decoded_compile_output = decode(res.compile_output ? res.compile_output : '');
    const decoded_error = decode(res.stderr ? res.stderr : '');

    let final_output = '';
    if (res.status_id !== 3) {
      if (decoded_compile_output === "") {
        final_output = decoded_error;
      }
      else {
        final_output = decoded_compile_output;
      }
    }
    else {
      final_output = decoded_output;
    }
    setCurrentOutput(status_name + "\n\n" + final_output);
    closeModal();
  }

  const getFile = (e, setState) => {
    const input = e.target;
    if ("files" in input && input.files.length > 0) {
      placeFileContent(input.files[0], setState);
    }
  };

  const placeFileContent = (file, setState) => {
    readFileContent(file)
      .then((content) => {
        setState(content)
      })
      .catch((error) => console.log(error));
  };

  function readFileContent(file) {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = (event) => resolve(event.target.result);
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    });
  }

  return (
    <div>
      <Navbar isFullScreen={isFullScreen} />
      <MainContainer isFullScreen={isFullScreen}>
        <EditorContainer
          title={title}
          currentLanguage={currentLanguage}
          setCurrentLanguage={setCurrentLanguage}
          currentCode={currentCode}
          setCurrentCode={setCurrentCode}
          folderId={folderId}
          playgroundId={playgroundId}
          saveCode={saveCode}
          runCode={runCode}
          getFile={getFile}
          isFullScreen={isFullScreen}
          setIsFullScreen={setIsFullScreen}
        />
        <Consoles>
          <InputConsole
            currentInput={currentInput}
            setCurrentInput={setCurrentInput}
            getFile={getFile}
          />
          <OutputConsole
            currentOutput={currentOutput}
          />
        </Consoles>
      </MainContainer>
      {isOpenModal.show && <Modal />}
    </div>
  )
}

// export default Playground