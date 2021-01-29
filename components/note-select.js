import React, {useState} from 'react';
import styles from '../styles/component-styles.module.css';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Alert from 'react-bootstrap/Alert';
import {serialize} from '../components/slate-note-editor.js';

export default function NoteSelect(props){
  return(
    <div className={styles.noteselect}>
      <TopBar
        onInputChange={props.onSearchInputChange}
        onKeyPress={props.onSearchKeyPress}
        onSearchButton={props.onSearchButton}
        searchInput={props.searchInput}
        curQuery = {props.curQuery}
        currentTheme={props.currentTheme}
      />
      <NoteList curNotes={props.curNotes} pins = {props.pins}
      alertMessage = {props.alertMessage} currentTheme={props.currentTheme} onPin = {props.onPin}
      onClick={props.onNoteClick} show = {props.showAlert} setShow = {props.setShowAlert}/>
    </div>
  )
}

function TopBar(props){
  return(
    <div className={styles.topbar}>
      <Button variant={"primary-"+props.currentTheme} size="sm" onClick={props.onSearchButton}> Search </Button>
      <input
        type="text"  id="selsearch" className={styles.searchbar} value={props.searchInput}
        onChange={props.onInputChange} onKeyPress={props.onKeyPress}
      />
      <Badge variant={"primary-"+props.currentTheme}>
        {props.curQuery.external}
      </Badge>
    </div>
  );
}

function NoteList(props){
  return(
    <div className={styles.notelist}>
      {props.show &&
        <Alert variant={"success-"+props.currentTheme} onClose={()=>props.setShow(false)} dismissible={true}>
          <p> {props.alertMessage} </p>
        </Alert>
      }
      {(props.pins.slice().concat(props.curNotes.slice())).map((note, index) => {
        return <NoteCard
          note={note} active={props.active} setActive={props.setActive} onPin={props.onPin}
          index={index} onClick={props.onClick} currentTheme={props.currentTheme}/>;
      })}
    </div>
  );
}


function NoteCard(props){
  var data = props.note.content;
  var content = serialize(JSON.parse(data));
  if(content.length > 225){
    content = content.substring(0, 222).concat("...");
  }
  //REVIEW, add isactive to note state similarly to ispinned
  if(props.note.isActive || props.note.isPinned){
    return(
      //REVIEW, make sure this style is accounted for in theme2
      <Card border={(props.note.isActive?"primary-":"success-")+props.currentTheme}
        bg={(props.note.isActive?"primary-":"success-")+props.currentTheme}
        onClick={e=> {props.onClick(e, props.note)} }>
        <Card.Body>
          <Card.Subtitle>
            {props.note.isActive ? <Badge variant="light">Editing</Badge> : null}
            <Button size="sm" variant={(props.note.isPinned?"success-":"primary-")+props.currentTheme} onClick={e=>props.onPin(e, props.note)}>
              {props.note.isPinned ? "Unpin" : "Pin"}
            </Button>
          </Card.Subtitle>
          <Card.Text> {content} </Card.Text>
        </Card.Body>
      </Card>
    );
  }
  return(
    <Card onClick={e=> {props.onClick(e, props.note)} }>
      <Card.Body>
        <Card.Text> {content} </Card.Text>
      </Card.Body>
    </Card>
  );
}
