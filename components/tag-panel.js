import React from 'react';
import styles from '../styles/CreateNewPage.module.css';
import { caseInsensitiveSearch } from '../util/string-parsing.js';
import { DragDropContext, Droppable, Draggable, resetServerContext } from 'react-beautiful-dnd';

//Expected props: rootsTags, tagsTable, noteTags
export default function TagPanel(props){
  var wRecs = parseTags(props.wRecs.slice(), props.noteTags.slice(), props.tagsTable);
  return(
    <DragDropContext onDragEnd={props.onDragEnd} className={styles.tagpanel}>
      <ExtantTags
        rootTags={props.rootTags}
        tagsTable={props.tagsTable}
        noteTags={props.noteTags}
        onClick={props.onExClick}
      />
      <WatsonTags
        size = {Object.keys(props.tagsTable).length}
        onClick = {props.onWsClick}
        wRecs = {wRecs}
      />
    </DragDropContext>
  );
}

//REVIEW -- is too much to do while rendering??
function parseTags(wRecs, noteTags, tagsTable){
  wRecs = parseNoteTags();
  wRecs = parseWRecs();
  return wRecs;

  //assumes noteTgs is an array of STRINGS referring to tags
  //returns wRecs purged of matches with a tag in notetags
  function parseNoteTags(){
    var res = wRecs.slice();
    for(var p=0; p<noteTags.length; p++){
      //first match with tagsTable
      tagsTable[noteTags[p]].noteTagMatch = 1;
      //then with wRecs
      const index = res.findIndex(el => el._id.toLowerCase() == noteTags[p].toLowerCase());
      if(index > -1){
        res.splice(index, 1);
      }
    }
    return res;
  }
  function parseWRecs(){
    var res = wRecs.slice();
    for(var n=0; n<wRecs.length; n++){
      const key = caseInsensitiveSearch(wRecs[n]._id, tagsTable);
      if(typeof key !== 'undefined'){
        res[n].eTagMatch = 1;
        tagsTable[key].wTagMatch = 1;
      }
    }
    return res;
  }
}

function ExtantTags(props){
  return(
    <div className={styles.extags}>
      Existing tags:
      <TagTree
        rootTags={props.rootTags}
        tagsTable={props.tagsTable}
        noteTags={props.noteTags}
        onClick={props.onClick}
      />
    </div>
  );
}

//props: wRecs, size
function WatsonTags(props){
  function tagsToButton(dTag, index){
    return (
      <Draggable key = {""+index} draggableId={"wS"+dTag._id} index={index}>
        {(provided) => (
          <li ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
            <TagButton
              className= {dTag.eTagMatch ? styles.wrecmatchbutton : styles.addtagbutton}
              onClick={props.onClick}
              tag={dTag._id}
            />
          </li>
        )}
      </Draggable>
    );
  }
  return(
    <div className={styles.wstags}>
      Suggested Tags:
      <Droppable droppableId="wstags" isDropDisabled={true}>
        {(provided) => (
          <ul {...provided.droppableProps} ref={provided.innerRef}>
            {props.wRecs.map((el, index) => tagsToButton(el, (props.size + index)))}
          </ul>
        )}
      </Droppable>
    </div>
  )
}

function TagTree(props){
  const rootTags = props.rootTags.slice();
  const noteTags = props.noteTags.slice();
  var tagsTable = props.tagsTable;
  var results = [];

  for(var n=0; n<rootTags.length; n++){
    const root = rootTags[n];
    const res = helperTreeRecurse(root);
    results.push(res); //the draggable list item
  }
  //REVIEW: combining is currently off
  return (
    <div>
      <Droppable droppableId="extantTree" isCombineEnabled={true}>
        {(provided) => (
          <ul {...provided.droppableProps} ref={provided.innerRef}>
            {results}
          </ul>
        )}
      </Droppable>
    </div>
  );

  function helperTreeRecurse(tag){
    const myTag = tagsTable[tag];
    var myResults = [];
    //loop through children to add to results
    for(var n=0; n<myTag.children.length; n++){
      const res = helperTreeRecurse(myTag.children[n]);
      myResults.push(res);
    }
    const data = tagsTable[tag];
    var className;
    if(data.noteTagMatch){
      className = styles.removetagbutton;
    }
    else if(data.wTagMatch){
      className = styles.wrecmatchbutton;
    }
    else {
      className = styles.addtagbutton;
    }

    return(
      <div>
        <TagTreeNode
          tag={data}
          className={className}
          onClick={props.onClick}
        />
        <ul>
          {myResults}
        </ul>
      </div>
    );
  }
}

function TagTreeNode(props){
  return(
    <Draggable key = {""+props.tag.index} draggableId={props.tag._id} index={props.tag.index}>
      {(provided) => (
        <li ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
          <TagButton tag={props.tag._id} className={props.className} onClick={props.onClick}/>
        </li>
      )}
    </Draggable>
  );
}

function TagButton(props){
  return(
    <button
      onClick={(e)=>props.onClick(e, props.tag)}
      className={props.className}
    > {props.tag} </button>
  )
}

export {TagButton}
