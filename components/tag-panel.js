import React from 'react';
import styles from '../styles/CreateNewPage.module.css';
import { DragDropContext, Droppable, Draggable, resetServerContext } from 'react-beautiful-dnd';

//Expected props: rootsTags, tagsTable, noteTags
export default function TagPanel(props){
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
        wRecs = {props.wRecs}
      />
    </DragDropContext>
  );
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
              type= {true}
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

  //first find each tag in the hashtable that corresponds to a note tag,
  //marking them for ease of tree construction
  matchNoteTags(noteTags);

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

  //REVIEW
  //assumes noteTgs is an array of STRINGS referring to tags
  function matchNoteTags(noteTgs){
    for(var p=0; p<noteTgs.length; p++){
      tagsTable[noteTgs[p]].noteTagMatch = 1;
    }
  }
  function helperTreeRecurse(tag){
    console.log(tag);
    const myTag = tagsTable[tag];
    var myResults = [];
    //loop through children to add to results
    for(var n=0; n<myTag.children.length; n++){
      const res = helperTreeRecurse(myTag.children[n]);
      myResults.push(res);
    }
    const data = tagsTable[tag];
    const type = data.noteTagMatch ? 0 : 1;

    return(
      <div>
        <TagTreeNode
          tag={data}
          type={type}
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
          <TagButton tag={props.tag._id} type={props.type} onClick={props.onClick}/>
        </li>
      )}
    </Draggable>
  );
}

function TagButton(props){
  return(
    <button
      onClick={(e)=>props.onClick(e, props.tag)}
      className={props.type ? styles.addtagbutton : styles.removetagbutton}
    > {props.tag} </button>
  )
}

export {TagButton}
