import React from 'react';
import styles from '../styles/CreateNewPage.module.css';
import {TagButton} from '../components/tag-panel.js';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';

//NewNote, a controlled component for writing a new note
export default function NewNote(props){
  return(
    <div className={styles.newnote}>
      <TopBar
        id="1"
        onClick={props.tagBarOnClick}
        onKeyPress={props.onKeyPress}
        onTagInputChange={props.onTagInputChange}
        tagInput={props.tagInput}
        tags={props.note.tags}
        currentTheme={props.currentTheme}
        />
      <NoteTextBox
        content= {props.note.content}
        onInputChange= {props.handleNoteInputChange}
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
        tag={tag}
      />
    );
  }
  var tags = props.tags.slice();
  return(
    <div className={styles.topbar}>
      <Badge variant="light"> Tags </Badge>
      <input type="text" onChange={props.onTagInputChange} onKeyPress={props.onKeyPress} id="tags" className="searchbar" value={props.tagInput}/>
      <span className={styles.toplabels}>
        {tags.map(toTagButton)}
      </span>
    </div>
  );
}

//NoteTextBox, the input text box for the current note
function NoteTextBox(props){
  return(
    <textarea
      className={styles.noteinput}
      name="note"
      value={props.content}
      onChange={props.onInputChange}
    />
  )
}

//BottomBar, holding the submit and save changes buttons
function BottomBar(props){
  return(
    <div className={"buttonbar"}>
      <Button variant={"primary-"+props.currentTheme} onClick={props.handleSaveClick} disabled={!props.unsavedChanges}> Save changes </Button>
      <Button variant="secondary" onClick={props.handleNewNoteClick}> New note </Button>
      <Button variant={"primary-"+props.currentTheme} onClick={props.publishOnClick}> Analyze </Button>
    </div>
  )
}
