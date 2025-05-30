import React, { useContext, useState } from 'react'
import {Input, Header, CloseButton } from './ModalStyling'
import { IoCloseSharp } from 'react-icons/io5'
import { ModalContext } from '../context/ModalContext'
import { PlaygroundContext } from '../context/PlaygroundContext'
import Select from 'react-select';
import styled from 'styled-components';
import { languageMap } from '../context/PlaygroundContext'
const InputWithSelect = styled.div`
  display: grid;
  grid-template-columns: 1fr 0.5fr;
  gap: 1rem;
  margin-top: 1.2rem;
  align-items: center;

  input {
    flex-grow: 1;
    height: 2rem;
  }

  button {
    background: #241f21;
    height: 2.5rem;
    color: white;
    padding: 0.3rem 2rem;
  }

  & > div {
    width: 8rem;
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const NewFolder = () => {
    const { closeModal } = useContext(ModalContext);
    const { addFolder } = useContext(PlaygroundContext);
    const [folderTitle , setFolderTitle ] = useState("");
    return (
        <>
        <Header>
            <h2>Create New Folder</h2>
            <CloseButton onClick={() => closeModal()}>
                <IoCloseSharp />
            </CloseButton>
            </Header>
            <Input>
            <input type="text"  onChange={(e) => setFolderTitle(e.target.value)} />
            <button onClick={() => {
                addFolder(folderTitle);
                closeModal()
            }}>Create Folder</button>
            </Input>
            </>
    )
}

export const NewPlayground = () => {
  const { isOpenModal, closeModal } = useContext(ModalContext);
  const { addPlayground } = useContext(PlaygroundContext);

  const languageOptions = [
    { value: "cpp", label: "cpp" },
    { value: "java", label: "java" },
    { value: "javascript", label: "javascript" },
    { value: "python", label: "python" },
  ];

  const {folderId} = isOpenModal.identifiers;

  const [cardTitle, setCardTitle] = useState("");
  const [language, setLanguage] = useState(languageOptions[0]);

  const handleLanguageChange = (selectedOption) => {
    setLanguage(selectedOption);
  };

  return (
    <>
      <Header>
        <h2>Create New Playground</h2>
        <CloseButton onClick={() => closeModal()}>
          <IoCloseSharp />
        </CloseButton>
      </Header>
      <InputWithSelect>
        <input
          type='text'
          onChange={(e) => setCardTitle(e.target.value)}
        />
        <Select
          options={languageOptions}
          value={language}
          onChange={handleLanguageChange}
        />
        <button onClick={() => {
            const defaultCode = languageMap[language.label]?.defaultCode || "";
          addPlayground({folderId, title: cardTitle, language: language.label, code : defaultCode})

          closeModal();
        }}> Create Playground </button>
      </InputWithSelect>
    </>
  )
}
