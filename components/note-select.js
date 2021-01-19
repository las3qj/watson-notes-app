import React, {useState} from 'react';
import styles from '../styles/CreateNewPage.module.css';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Alert from 'react-bootstrap/Alert';

export default function NoteSelect(props){
  const [active, setActive] = useState(-1);
  return(
    <div className={styles.noteselect}>
      <TopBar
        onInputChange={props.onSearchInputChange}
        onKeyPress={props.onSearchKeyPress}
        searchInput={props.searchInput}
        curQuery = {props.curQuery}
        currentTheme={props.currentTheme}
      />
      <NoteList notes={props.notes} show = {props.showAlert} setShow = {props.setShowAlert}
      alertMessage = {props.alertMessage} currentTheme={props.currentTheme}
      active={active} setActive={setActive} onClick={props.onNoteClick}/>
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
      {props.notes.map((note, index) => {
        return <NoteCard
          note={note} active={props.active} setActive={props.setActive}
          index={index} onClick={props.onClick} currentTheme={props.currentTheme}/>;
      })}
    </div>
  );
}


function NoteCard(props){
  var content = props.note.content.slice();
  if(content.length > 225){
    content = content.substring(0, 222).concat("...");
  }
  if(props.active == props.index){
    return(
      <Card border={"primary-"+props.currentTheme} bg={"primary-"+props.currentTheme} onClick={e=> {
        props.setActive(props.index)
        props.onClick(e, props.note)} }>
        <Card.Body>
          <Card.Text> {content} </Card.Text>
        </Card.Body>
      </Card>
    );
  }
  return(
    <Card onClick={e=> {
      props.setActive(props.index)
      props.onClick(e, props.note)} }>
      <Card.Body>
        <Card.Text> {content} </Card.Text>
      </Card.Body>
    </Card>
  );
}
