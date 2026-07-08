'use client'; // only in App Router
import { FC } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import {
    ClassicEditor,
    Bold,
    Essentials,
    Italic,
    Paragraph,
    Undo,
    EventInfo,
    Heading,
    SourceEditing,
    FontSize,
    List,
    FontColor,
    FontBackgroundColor,
    Link,
    BlockQuote,
    FullPage,
    GeneralHtmlSupport,
    HtmlComment,
    FontFamily,
    TodoList,
    Underline,
    Strikethrough,
    Superscript,
    Subscript,
    Alignment,
    Table,
    TableToolbar,
    MediaEmbed,
    Image,
    ImageCaption,
    ImageResize,
    ImageStyle,
    ImageToolbar,
    ImageUpload,
    Base64UploadAdapter, 
    Mention,
    Autosave,
    CodeBlock,
    Highlight,
    HorizontalLine,
    PageBreak,
    TextTransformation,
} from 'ckeditor5';

import 'ckeditor5/ckeditor5.css';

interface CustomEditorProps {
    data?: string;
    onChange: (event: EventInfo, editor: ClassicEditor) => void;
}

const CustomEditor: FC<CustomEditorProps> = ({ data, onChange }) => {
    return (
        <>
            <CKEditor
                editor={ClassicEditor}
                data={data}
                config={{
                    toolbar: {
                        items: [
                            'sourceEditing',
                            '|',
                            'heading',
                            '|',
                            {
                                label: 'Font',
                                icon: false,
                                withText: true,
                                items: ['fontfamily', 'bold', 'italic', 'underline', 'alignment', 'strikethrough', 'subscript', 'superscript'],
                            },
                            // '|',
                            // 'fontfamily',
                            '|',
                            'undo',
                            'redo',
                            'uploadImage',
                            'mediaEmbed',
                            '|',
                            'fontfamily',
                            'fontsize',
                            'fontColor',
                            'fontBackgroundColor',
                            '|',
                            'link',
                            'blockQuote',
                            '|',
                            'insertTable',
                            '|',
                            {
                                label: 'Lists',
                                icon: false,
                                items: ['bulletedList', 'numberedList', 'todoList'],
                            },
                            '|',
                            'codeBlock',
                            'highlight',
                            'horizontalLine',
                            'pageBreak',
                            'wordCount',
                        ],
                        shouldNotGroupWhenFull: true,
                    },
                    fontSize: {
                        options: [14, 16, 18, 20, 22, 24, 26, 28, 30, 32],
                        supportAllValues: true,
                    },
                    heading: {
                        options: [
                            { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
                            { model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
                            { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
                            { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
                            { model: 'heading4', view: 'h4', title: 'Heading 4', class: 'ck-heading_heading4' },
                            { model: 'heading5', view: 'h5', title: 'Heading 5', class: 'ck-heading_heading5' },
                            { model: 'heading6', view: 'h6', title: 'Heading 6', class: 'ck-heading_heading6' },
                        ],
                    },
                    link: {
                        addTargetToExternalLinks: true,
                        defaultProtocol: 'https://',
                        decorators: {
                            toggleDownloadable: {
                                mode: 'manual',
                                label: 'Downloadable',
                                attributes: {
                                    download: 'file',
                                },
                            },
                        },
                    },
                    htmlSupport: {
                        allow: [
                            {
                                name: /.*/,
                                attributes: true,
                                classes: true,
                                styles: true,
                            },
                        ],
                        allowEmpty: ['i', 'span'],
                    },
                    image: {
                        resizeOptions: [
                            {
                                name: 'resizeImage:original',
                                label: 'Default image width',
                                value: null,
                            },
                            {
                                name: 'resizeImage:50',
                                label: '50% page width',
                                value: '50',
                            },
                            {
                                name: 'resizeImage:75',
                                label: '75% page width',
                                value: '75',
                            },
                        ],
                        toolbar: [
                            'imageTextAlternative',
                            'toggleImageCaption',
                            '|',
                            'imageStyle:inline',
                            'imageStyle:wrapText',
                            'imageStyle:breakText',
                            '|',
                            'resizeImage',
                        ],
                    },
                    table: {
                        contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells', 'tableProperties', 'tableCellProperties'],
                    },
                    plugins: [
                        FullPage,
                        GeneralHtmlSupport,
                        SourceEditing,
                        HtmlComment,
                        Heading,
                        FontSize,
                        Bold,
                        Underline,
                        Strikethrough,
                        Subscript,
                        Superscript,
                        Essentials,
                        Italic,
                        Alignment,
                        Paragraph,
                        Undo,
                        List,
                        TodoList,
                        Link,
                        BlockQuote,
                        Image,
                        ImageCaption,
                        ImageResize,
                        ImageStyle,
                        ImageToolbar,
                        ImageUpload,
                        Base64UploadAdapter,
                        FontColor,
                        FontBackgroundColor,
                        FontFamily,
                        Table,
                        TableToolbar,
                        MediaEmbed,
                        // WordCount,
                        Mention,
                        Autosave,
                        CodeBlock,
                        Highlight,
                        HorizontalLine,
                        PageBreak,
                        TextTransformation,
                    ],
                    mention: {
                        feeds: [
                            {
                                marker: '@',
                                feed: ['@mention1', '@mention2', '@mention3'],
                                minimumCharacters: 1,
                            },
                        ],
                    },
                }}
                onChange={onChange}

            />
        </>
    );
};

export default CustomEditor;