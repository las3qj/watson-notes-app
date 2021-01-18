import React from 'react';
import styles from '../styles/CreateNewPage.module.css';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';

export default function NoteSelect(props){
  return(
    <div className={styles.noteselect}>
      <TopBar
        onInputChange={props.onSearchInputChange}
        onKeyPress={props.onSearchKeyPress}
        searchInput={props.searchInput}
        curQuery = {props.curQuery}
      />
      <NoteList notes={props.notes} onClick={props.onNoteClick}/>
    </div>
  )
}

function TopBar(props){
  return(
    <div className={styles.topbar}>
      <Badge variant="light"> Search </Badge>
      <input
        type="text"  id="search" className="searchbar" value={props.searchInput}
        onChange={props.onInputChange} onKeyPress={props.onKeyPress}
      />
      <Badge variant="primary">
        {props.curQuery.external}
      </Badge>
    </div>
  );
}

function NoteList(props){
  return(
    <div className={styles.notelist}>
      {props.notes.map(note => {
        return <NewNoteCard note={note} onClick={props.onClick}/>;
      })}
    </div>
  );
}

function NoteCard(props){
  return(
    <div className={styles.notecard} onClick={e=> props.onClick(e, props.note)}>
      <div className={styles.notetext} onClick={e=> props.onClick(e, props.note)}>
        {props.note.content}
      </div>
    </div>
  )
}

function NewNoteCard(props){
  var content = props.note.content.slice();
  if(content.length > 225){
    content = content.substring(0, 222).concat("...");
  }
  return(
    <Card onClick={e=> props.onClick(e, props.note)}>
      <Card.Body>
        <Card.Text> {content} </Card.Text>
      </Card.Body>
    </Card>
  );
}
