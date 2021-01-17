import React from 'react';
import styles from '../styles/CreateNewPage.module.css';

export default function NoteSelect(props){
  return(
    <div className={styles.noteselect}>
      <TopBar
        onInputChange={props.onSearchInputChange}
        onKeyPress={props.onSearchKeyPress}
        searchInput={props.searchInput}
      />
      <NoteList notes={props.notes} onClick={props.onNoteClick}/>
    </div>
  )
}

function TopBar(props){
  return(
    <div className={styles.topbar}>
      <label htmlFor="search" className={styles.toplabels}> search: </label>
      <input
        type="text"  id="search" className="searchInput" value={props.searchInput}
        onChange={props.onInputChange} onKeyPress={props.onKeyPress}
      />
    </div>
  );
}

function NoteList(props){
  return(
    <div className={styles.notelist}>
      {props.notes.map(note => {
        return <NoteCard note={note} onClick={props.onClick}/>;
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
