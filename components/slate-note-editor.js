// Import React dependencies.
import React, { useCallback, useMemo, useState } from 'react';
import isHotkey from 'is-hotkey';
import { Editable, withReact, useSlate, Slate } from 'slate-react';
import {
  Editor,
  Transforms,
  createEditor,
  Node,
  Range,
  Point,
  Text,
  Element as SlateElement,
} from 'slate';
import { withHistory } from 'slate-history';
import Icon from '../components/icon.js';
import { ICONS } from '../util/icon-constants.js';
import styles from '../styles/component-styles.module.css';

const MARKHOTKEYS = {
  'mod+b': 'bold',
  'mod+i': 'italic',
  'mod+u': 'underline',
  'mod+\`': 'strike'
}

const BLOCKHOTKEYS = {
  'mod+l': 'bulleted-list',
  'mod+q': 'block-quote'
}

const MISCHOTKEYS = {
  'mod+s': 'save'
}

const SHORTCUTS = {
  '*': 'list-item',
  '-': 'list-item',
  '+': 'list-item',
  '>': 'block-quote',
  '#': 'heading-one',
  '##': 'heading-two',
  '###': 'heading-three',
  '####': 'heading-four',
  '#####': 'heading-five',
  '######': 'heading-six',
}

const LIST_TYPES = ['numbered-list', 'bulleted-list'];

export default function SlateNoteEditor(props){
  const renderElement = useCallback(props => <Element {...props} />, []);
  const renderLeaf = useCallback(props => <Leaf {...props} />, []);
  const editor = useMemo(() => withShortcuts(withHistory(withReact(createEditor()))), []);

  return(
    <Slate
      editor={editor}
      value={props.content? JSON.parse(props.content): initialValue}
      onChange={value => {
        props.onInputChange(JSON.stringify(value));
      }}
    >
      <div className={styles.noteeditorbar}>
        <MarkButton format="bold" icon={ICONS.BOLD} />
        <MarkButton format="italic" icon={ICONS.ITALIC} />
        <MarkButton format="underline" icon={ICONS.UNDERLINE} />
        <MarkButton format="strike" icon={ICONS.STRIKE} />
        <BlockButton format="block-quote" icon={ICONS.QUOTE} />
        <BlockButton format="numbered-list" icon={ICONS.NUMBEREDLIST} />
        <BlockButton format="bulleted-list" icon={ICONS.BULLETEDLIST} />
      </div>

      <Editable
        className={styles.noteeditable}
        renderElement={renderElement}
        renderLeaf={renderLeaf}
        placeholder="Enter some rich text…"
        spellCheck
        autoFocus
        onKeyDown={event => {
          for (const markhotkey in MARKHOTKEYS) {
            if (isHotkey(markhotkey, event)) {
              event.preventDefault();
              const mark = MARKHOTKEYS[markhotkey];
              toggleMark(editor, mark);
              return;
            }
          }
          for (const blockhotkey in BLOCKHOTKEYS) {
            if (isHotkey(blockhotkey, event)) {
              event.preventDefault();
              const format = BLOCKHOTKEYS[blockhotkey];
              toggleBlock(editor, format);
              return;
            }
          }
          for (const mischotkey in MISCHOTKEYS) {
            if (isHotkey(mischotkey, event)) {
              const command = MISCHOTKEYS[mischotkey];
              if(command == 'save'){
                event.preventDefault();
                props.onSave();
              }
            }
          }
        }}
      >
      </Editable>
    </Slate>
  )
}

const toggleBlock = (editor, format) => {
  const isActive = isBlockActive(editor, format);
  const isList = LIST_TYPES.includes(format);

  Transforms.unwrapNodes(editor, {
    match: n =>
      LIST_TYPES.includes(
        !Editor.isEditor(n) && SlateElement.isElement(n) && n.type
      ),
    split: true,
  });
  const newProperties = {
    type: isActive ? 'paragraph' : isList ? 'list-item' : format,
  };
  Transforms.setNodes(editor, newProperties);

  if (!isActive && isList) {
    const block = { type: format, children: [] };
    Transforms.wrapNodes(editor, block);
  }
};

const toggleMark = (editor, format) => {
  const isActive = isMarkActive(editor, format);
  Transforms.setNodes(editor,
    {[format] : !isActive},
    {match: n => Text.isText(n), split: true}
  );
};

const isBlockActive = (editor, format) => {
  const [match] = Editor.nodes(editor, {
    match: n =>
      !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === format,
  })

  return !!match;
};

const isMarkActive = (editor, format) => {
  const [match] = Editor.nodes(editor, {
    match: n =>
      !Editor.isEditor(n) && !SlateElement.isElement(n) && Text.isText(n) && n[format]
  })

  return !!match;
}

//element renderers
const Element = props => {
  switch (props.element.type) {
    case 'block-quote':
      return <BlockQuoteElement {...props} />
    case 'heading-one':
      return <Heading1Element {...props} />
    case 'heading-two':
      return <Heading2Element {...props} />
    case 'heading-three':
      return <Heading3Element {...props} />
    case 'heading-four':
      return <Heading4Element {...props} />
    case 'heading-five':
      return <Heading5Element {...props} />
    case 'heading-six':
      return <Heading6Element {...props} />
    case 'bulleted-list':
      return <BulletedListElement {...props} />
    case 'numbered-list':
      return <NumberedListElement {...props} />
    case 'list-item':
      return <ListItemElement {...props} />
    default:
      return <DefaultElement {...props} />
  }
}

const DefaultElement = props => {
  return <p{...props.attributes}>{props.children}</p>
}
const BlockQuoteElement = props => {
  return <blockquote{...props.attributes}>{props.children}</blockquote>;
}
const Heading1Element = props => {
  return <h1{...props.attributes}>{props.children}</h1>
}
const Heading2Element = props => {
  return <h2{...props.attributes}>{props.children}</h2>
}
const Heading3Element = props => {
  return <h3{...props.attributes}>{props.children}</h3>
}
const Heading4Element = props => {
  return <h4{...props.attributes}>{props.children}</h4>
}
const Heading5Element = props => {
  return <h5{...props.attributes}>{props.children}</h5>
}
const Heading6Element = props => {
  return <h6{...props.attributes}>{props.children}</h6>
}
const BulletedListElement = props => {
  return <ul{...props.attributes}>{props.children}</ul>;
}
const NumberedListElement = props => {
  return <ol{...props.attributes}>{props.children}</ol>;
}
const ListItemElement = props => {
  return <li{...props.attributes}>{props.children}</li>;
}

const Leaf = ({ attributes, children, leaf }) => {
  if (leaf.bold) {
    children = <strong>{children}</strong>
  }
  if (leaf.italic) {
    children = <em>{children}</em>
  }
  if (leaf.underline) {
    children = <u>{children}</u>
  }
  if (leaf.strike) {
    children = <s>{children}</s>
  }
  return <span {...attributes}>{children}</span>
}

const withShortcuts = editor => {
  const { deleteBackward, insertText } = editor

  editor.insertText = text => {
    const { selection } = editor

    if (text === ' ' && selection && Range.isCollapsed(selection)) {
      const { anchor } = selection
      const block = Editor.above(editor, {
        match: n => Editor.isBlock(editor, n),
      })
      const path = block ? block[1] : []
      const start = Editor.start(editor, path)
      const range = { anchor, focus: start }
      const beforeText = Editor.string(editor, range)
      const type = SHORTCUTS[beforeText]

      if (type) {
        Transforms.select(editor, range)
        Transforms.delete(editor)
        const newProperties = {
          type,
        }
        Transforms.setNodes(editor, newProperties, {
          match: n => Editor.isBlock(editor, n),
        })

        if (type === 'list-item') {
          const list = { type: 'bulleted-list', children: [] }
          Transforms.wrapNodes(editor, list, {
            match: n =>
              !Editor.isEditor(n) &&
              SlateElement.isElement(n) &&
              n.type === 'list-item',
          })
        }

        return
      }
    }

    insertText(text)
  }

  editor.deleteBackward = (...args) => {
    const { selection } = editor

    if (selection && Range.isCollapsed(selection)) {
      const match = Editor.above(editor, {
        match: n => Editor.isBlock(editor, n),
      })

      if (match) {
        const [block, path] = match
        const start = Editor.start(editor, path)

        if (
          !Editor.isEditor(block) &&
          SlateElement.isElement(block) &&
          block.type !== 'paragraph' &&
          Point.equals(selection.anchor, start)
        ) {
          const newProperties = {
            type: 'paragraph',
          }
          Transforms.setNodes(editor, newProperties)

          if (block.type === 'list-item') {
            Transforms.unwrapNodes(editor, {
              match: n =>
                !Editor.isEditor(n) &&
                SlateElement.isElement(n) &&
                n.type === 'bulleted-list',
              split: true,
            })
          }

          return
        }
      }

      deleteBackward(...args)
    }
  }

  return editor
}

function MarkButton(props){
  const editor = useSlate();
  return (
    <button className= {styles.iconbutton}
      onMouseDown={event => {
        event.preventDefault();
        toggleMark(editor, props.format);
      }}
    >
      <Icon icon={props.icon} size="14" active={isMarkActive(editor, props.format)}/>
    </button>
  );
}

function BlockButton(props){
  const editor = useSlate();
  return (
    <button className= {styles.iconbutton}
      onMouseDown={event => {
        event.preventDefault()
        toggleBlock(editor, props.format)
      }}
    >
      <Icon icon={props.icon} size="14" active={isBlockActive(editor, props.format)} />
    </button>
  )
}

function serialize(value){
  return (
    value
      // Return the string content of each paragraph in the value's children.
      .map(n => Node.string(n))
      // Join them all with line breaks denoting paragraphs.
      .join('\n')
  );
}

const initialValue = [
  {
    type: 'paragraph',
    children: [
      { text: 'This is editable ' },
      { text: 'rich', bold: true },
      { text: ' text, ' },
      { text: 'much', italic: true },
      { text: ' better than a ' },
      { text: '<textarea>' },
      { text: '!' },
    ],
  },
  {
    type: 'paragraph',
    children: [
      {
        text:
          "Since it's rich text, you can do things like turn a selection of text ",
      },
      { text: 'bold', bold: true },
      {
        text:
          ', or add a semantically rendered block quote in the middle of the page, like this:',
      },
    ],
  },
  {
    type: 'block-quote',
    children: [{ text: 'A wise quote.' }],
  },
  {
    type: 'paragraph',
    children: [{ text: 'Try it out for yourself!' }],
  },
];

export {serialize};
