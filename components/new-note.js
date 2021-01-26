import React from 'react';
import {useRef, useState, useEffect} from 'react';
import styles from '../styles/component-styles.module.css';
import {TagButton} from '../components/tag-panel.js';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import dynamic from "next/dynamic";
import SlateNoteEditor from '../components/slate-note-editor.js';

//NewNote, a controlled component for writing a new note
export default function NewNote(props){
  return(
    <div className={styles.newnote}>
      <TopBar
        id="1"
        onClick={props.tagBarOnClick}
        onKeyPress={props.onKeyPress}
        tagsTable={props.tagsTable}
        onTagInputChange={props.onTagInputChange}
        tagInput={props.tagInput}
        tags={props.note.tags}
        currentTheme={props.currentTheme}
        />
      <SlateNoteEditor
        onInputChange={value => props.handleNoteInputChange(value)}
        content={props.note.content}
        onSave={props.handleSaveClick}
      />
      <BottomBar
        unsavedChanges = {props.note.unsavedChanges}
        publishOnClick={props.handlePublishClick}
        handleSaveClick = {props.handleSaveClick}
        handleNewNoteClick = {props.handleNewNoteClick}
        currentTheme={props.currentTheme}
      />
    </div>
  );
}

//TopBar, the component containing various inputs and curNote info
function TopBar(props){
  function toTagButton(tag){
    return (
      <TagButton
        variant="success"
        currentTheme={props.currentTheme}
        onClick={props.onClick}
        tag={props.tagsTable[tag]}
      />
    );
  }
  var ids = props.tags.slice();
  return(
    <div className={styles.topbar}>
      <Badge variant="light"> Add tags </Badge>
      <input type="text" onChange={props.onTagInputChange} onKeyPress={props.onKeyPress} id="tags" className={styles.searchbar} value={props.tagInput}/>
      <ScrollBar ids={ids} currentTheme={props.currentTheme} tagsTable={props.tagsTable} onClick={props.onClick}/>
    </div>
  );
}

function ScrollBar(props){
  function toTagButton(tag){
    return (
      <TagButton
        variant="success"
        currentTheme={props.currentTheme}
        onClick={props.onClick}
        tag={props.tagsTable[tag]}
      />
    );
  }
  return(
    <div className={styles.outtertagscrollmenu}>
      <div className={styles.innertagscrollmenu}>
        {props.ids.map(toTagButton)}
      </div>
    </div>
  );
}

//BottomBar, holding the submit and save changes buttons
function BottomBar(props){
  return(
    <div className={styles.buttonbar}>
      <Button variant={"primary-"+props.currentTheme} onClick={props.handleSaveClick} disabled={!props.unsavedChanges}> Save changes </Button>
      <Button variant="secondary" onClick={props.handleNewNoteClick}> New note </Button>
      <Button variant={"primary-"+props.currentTheme} onClick={props.publishOnClick}> Get suggestions </Button>
    </div>
  )
}
