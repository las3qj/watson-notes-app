import React from 'react';
import styles from '../styles/CreateNewPage.module.css';
import {TagButton} from '../components/tag-panel.js';

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
        tags={props.cTags}
        />
      <NoteTextBox
        content= {props.noteInput}
        onInputChange= {props.handleNoteInputChange}
      />
      <BottomBar
        publishOnClick={props.handlePublishClick}
        handleSaveClick = {props.handleSaveClick}
        handleNewNoteClick = {props.handleNewNoteClick}
      />
    </div>
  );
}

//TopBar, the component containing various inputs and curNote info
function TopBar(props){
  function toTagButton(tag){
    return (
      <TagButton
        className={styles.removetagbutton}
        onClick={props.onClick}
        tag={tag}
      />
    );
  }
  var tags = props.tags.slice();
  return(
    <div className={styles.topbar}>
      <label htmlFor="tags" className={styles.toplabels}> tags: </label>
      <input type="text" onChange={props.onTagInputChange} onKeyPress={props.onKeyPress} id="tags" className="TagInput" value={props.tagInput}/>
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
    <div className={styles.bottombar}>
      <button onClick={props.handleSaveClick}> Save changes </button>
      <button onClick={props.handleNewNoteClick}> New note </button>
      <button onClick={props.publishOnClick}> Publish </button>
    </div>
  )
}
